(ns colabrador.core
  (:use org.httpkit.server)
  (:use [compojure.core :only (defroutes GET POST DELETE)])
  (:require [clojure.data.json :as json]
            [compojure.route :as route]
            [ring.middleware.cookies :refer [wrap-cookies]]
            [ring.middleware.params :refer [wrap-params]]
            [ring.middleware.session :refer [wrap-session]]
            [ring.util.response :refer [file-response redirect]])
  (:require [ring.middleware.file :refer [wrap-file]])
  (:gen-class))

(def ^:dynamic *max-messages-per-user* 1)
(def ^:dynamic *board-ttl* 900000)
(def boards (atom {}))
(def board-channels (atom {}))

(defn current-user [request]
  (-> request :session :user-id))

(defn board-found [board-name]
  (some #(= (:name (second %)) board-name) @boards))

(defn answers-for [board-id]
  (:answers (get @boards board-id)))

(defn is-board-owner? [user board-id]
  (= user (:owner (get @boards board-id))))

;; Handlers -------------------------------------------------------------------
(defn login-handler [request]
  (if-let [user-id (get (:form-params request) "username")]
    {:body (json/write-str {:status "ok"
                            :user-id user-id})
     :session (assoc (:session request) :user-id user-id)}
    {:body (json/write-str {:status "fail"})}))

(defn login-info-handler [request]
  (if-let [user (current-user request)]
    {:body (json/write-str {:valid-session true
                            :user-id user})
     :headers {"Content-Type" "application/json"}}
    {:body (json/write-str {:valid-session false})
     :headers {"Content-Type" "application/json"}}))

(defn remove-unused-boards [boards-atom]
  (let [now (.getTime (java.util.Date.))
        min-unused-since (- now *board-ttl*)]
    (swap! boards-atom (fn [boards]
                         (into {}
                               (remove #(< (get (second %) :unused-since now)
                                           min-unused-since) boards))))))

(defn boards-handler [request]
  (remove-unused-boards boards)
  {:body (json/write-str {:boards (map (fn [[board-id board-props]]
                                         (assoc board-props :id board-id))
                                       @boards)})})

(defn boards-post-handler [request]
  (let [board-name (get (:form-params request) "board-name")
        board-question (get (:form-params request) "board-question")]
    (if (or (nil? board-name) (nil? board-question) (board-found board-name))
      {:body (json/write-str {:status "fail"})}
      (let [board-id (str (java.util.UUID/randomUUID))
            board {:name board-name
                   :question board-question
                   :creation-timestamp (.getTime (java.util.Date.))
                   :answers []
                   :owner (current-user request)}]
        (swap! boards assoc board-id board)
        (println (str "Now boards -> " @boards))
        {:body (json/write-str {:status "ok"
                                :board (assoc board :id board-id)})}))))

(defn board-post-handler [request]
  (let [board-id (-> request :params :board-id)]
    (let [user (current-user request)
          answer-text (get (:form-params request) "answer")
          answer {:text answer-text
                  :user user
                  :date (.getTime (java.util.Date.))
                  :id (str (java.util.UUID/randomUUID))}]
      (if (< (count (filter #(= (:user %) user)
                            (answers-for board-id))) *max-messages-per-user*)
        (do
          (swap! boards update-in [board-id :answers] (fn [m] (conj m answer)))
          (doseq [ch (get @board-channels board-id)]
            (send! ch (json/write-str answer)))
          {:body (json/write-str {:status "ok"})})
        {:body (json/write-str {:status "fail"
                                :message (str "Too many messages on board "
                                              (:name (get @boards board-id)))})}))))

(defn board-ws-handler [request]
  (let [board-id (-> request :params :board-id)
        user (current-user request)]
    (if (is-board-owner? user board-id)
      (with-channel request channel
        (when (websocket? channel)
          (swap! boards update-in [board-id] dissoc :unused-since)
          (swap! board-channels update-in [board-id] #(conj % channel))
          (println (str ">> NEW USER (" (count (get @board-channels board-id)) " users(s) total)"))
          (doseq [answer (answers-for board-id)]
            (send! channel (json/write-str answer)))
          (on-close channel (fn [status]
                              (println ">> CLOSED: " status)
                              (swap! boards assoc-in [board-id :unused-since] (.getTime (java.util.Date.)))
                              (swap! board-channels update-in [board-id]
                                     (fn [chs] (remove #(= channel %) chs)))))
          (on-receive channel (fn [data]
                                (println (str "Received " data " via WS"))))))
      {:body "You need to be the owner of the channel to receive information about it!"})))

(defn find-board-for-answer [answer-id boards]
  (loop [boards boards]
    (println (first boards))
    (let [[board-id {:keys [answers]}] (first boards)]
      (cond
       (some #(= answer-id (:id %)) answers) board-id
       (empty? boards) nil
       :else (recur (rest boards))))))

(defn answer-delete-handler [request]
  (let [answer-id (-> request :params :answer-id)
        board-id (find-board-for-answer answer-id @boards)]
    (if (nil? board-id)
      {:body (str "Can't find answer " answer-id)
       :status 404}
      (if (is-board-owner? (current-user request) board-id)
        (do
         (swap! boards update-in [board-id :answers]
                (fn [as] (remove #(= (:id %) answer-id) as)))
         {:status 204})
        {:body (str "You are not the owner of board " board-id)
         :status 400}))))

(defn logged-in-handler [handler]
  (fn [request]
    (if-let [user (current-user request)]
      (handler request)
      {:body "You need to be logged in to use this website!"})))

(defroutes app
  (GET "/" [] (file-response "resources/public/index.html"))
  (GET "/login-info" [] login-info-handler)
  (POST "/login" [] login-handler)
  (GET "/boards" [] (logged-in-handler boards-handler))
  (POST "/boards" [] (logged-in-handler boards-post-handler))
  (POST "/boards/:board-id" [] (logged-in-handler board-post-handler))
  (GET "/boards/:board-id/ws" [] (logged-in-handler board-ws-handler))
  (DELETE "/answers/:answer-id" [] (logged-in-handler answer-delete-handler))
  (route/resources "/")
  (route/not-found "404 Not Found"))

(def wrapped-app
  (-> app
      ;; TODO: this should have the :store option to avoid in-memory
      ;; sessions (that means that restarting the server will kill any
      ;; sessions and clients won't be able to reconnect)
      wrap-session
      wrap-params
      wrap-cookies))

(defn -main []
  (let [port 9090]
    (println (str "Starting server on http://localhost:" port))
    (run-server wrapped-app {:port port})))

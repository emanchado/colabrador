(ns colabrador.core
  (:use org.httpkit.server)
  (:use [compojure.core :only (defroutes GET POST)])
  (:require [clojure.data.json :as json]
            [compojure.route :as route]
            [ring.middleware.cookies :refer [wrap-cookies]]
            [ring.middleware.params :refer [wrap-params]]
            [ring.middleware.session :refer [wrap-session]]
            [ring.util.response :refer [file-response redirect]])
  (:require [ring.middleware.file :refer [wrap-file]])
  (:gen-class))

(def ^:dynamic *max-messages* 50)
(def boards (atom {}))
(def messages (atom []))
(def channels (atom []))

(defn process-command [input user]
  (let [command-name (get input "command")]
    (if (= "post" command-name)
      (let [message-text (get input "text")
            message {:text message-text
                     :user user
                     :date (str (new java.util.Date))
                     :id (str (java.util.UUID/randomUUID))}]
        (when (< (count @messages) *max-messages*)
          (println (str "Accepting message: " message-text))
          (swap! messages
                 (fn [m] (conj m message)))
          (doseq [ch @channels]
            (send! ch message-text))))
      (println (str "Ignoring incoming command " command-name)))))

(defn ws-handler [request]
  (let [user (-> request :session :user-id)]
    (println @messages)
    (with-channel request channel
      (when (websocket? channel)
        (swap! channels #(conj % channel))
        (println (str ">> NEW USER (" (count @channels) " users(s) total)"))
        (doseq [m @messages]
          (send! channel (:text m)))
        (on-close channel (fn [status]
                            (println ">> CLOSED: " status)
                            (swap! channels
                                   (fn [chs] (remove #(= channel %) chs)))))
        (on-receive channel (fn [data]
                              (println (str "Received " data))
                              (process-command (json/read-str data) user)))))))

(defn valid-session? [request]
  (-> request :session :user-id))

(defn user-id [request]
  (get (:form-params request) "username"))

(defn login-successful? [request]
  (user-id request))

(defn login-handler [request]
  (if (login-successful? request)
    (let [user-id (user-id request)]
      {:body (json/write-str {:status "ok"
                              :user-id user-id})
       :session (assoc (:session request) :user-id user-id)})
    {:body (json/write-str {:status "fail"})}))

(defn login-info-handler [request]
  (if (valid-session? request)
    {:body (json/write-str {:valid-session true
                            :user-id (-> request :session :user-id)})
     :headers {"Content-Type" "application/json"}}
    {:body (json/write-str {:valid-session false})
     :headers {"Content-Type" "application/json"}}))

(defn boards-handler [request]
  {:body (json/write-str {:boards (map (fn [[board-id board-props]]
                                         {:id board-id
                                          :name (:name board-props)
                                          :question (:question board-props)})
                                       @boards)})})

(defn board-found [board-name]
  (println (str "Trying to find board " board-name " in " @boards))
  (some #(= (:name (second %)) board-name) @boards))

(defn boards-post-handler [request]
  (let [board-name (get (:form-params request) "board-name")
        board-question (get (:form-params request) "board-question")]
    (if (or (nil? board-name) (board-found board-name))
      {:body (json/write-str {:status "fail"})}
      (let [board-id (str (java.util.UUID/randomUUID))]
        (swap! boards assoc board-id {:name board-name
                                      :question board-question
                                      :creation-timestamp (.getTime (java.util.Date.))
                                      :answers []
                                      :owner (-> request :session :user-id)})
        (println (str "Now boards -> " @boards))
        {:body (json/write-str {:status "ok"
                                :board-id board-id})}))))

(defroutes app
  (GET "/" [] (file-response "resources/public/index.html"))
  (GET "/login-info" [] login-info-handler)
  (POST "/login" [] login-handler)
  (GET "/boards" [] boards-handler)
  (POST "/boards" [] boards-post-handler)
  (GET "/ws" [] ws-handler)
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

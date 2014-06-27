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
(def users (atom []))
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
  (let [user (get-in request [:cookies "session" :value])]
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

(defn valid-session? [session-id]
  (println (str "Checking session " session-id))
  (println (str "Resultado: " (some #(= (:session-id %) session-id) @users)))
  (some #(= (:session-id %) session-id) @users))

(defn wrap-auth [handler]
  (fn [request]
    (let [incoming-session (get-in request [:cookies "session" :value])]
      (if (valid-session? incoming-session)
        (handler request)
        (file-response "resources/login.html")))))

(defn login-handler [request]
  (let [new-session (str (java.util.UUID/randomUUID))]
    (swap! users conj {:session-id new-session})
    {:body (json/write-str {:status "ok"
                            :session-id new-session})
     :status 200
     :cookies (assoc-in (:cookies request) ["session"] {:value new-session})}))

(defroutes app
  (GET "/" [] (wrap-auth (fn [r]
                           (file-response "resources/public/index.html"))))
  (POST "/" [] login-handler)
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

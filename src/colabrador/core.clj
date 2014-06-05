(ns colabrador.core
  (:use org.httpkit.server)
  (:use [compojure.core :only (defroutes GET POST)])
  (:require [clojure.data.json :as json]
            [compojure.route :as route]
            [ring.middleware.cookies :refer [wrap-cookies]]
            [ring.middleware.params :refer [wrap-params]]
            [ring.util.response :refer [file-response redirect]])
  (:require [ring.middleware.file :refer [wrap-file]])
  (:gen-class))

(def messages (atom []))
(def channels (atom []))
(def teacher-channels (atom []))

(defn chat-handler [request]
  (let [user (get-in request [:cookies "session" :value])]
    (println @messages)
    (with-channel request channel
      (swap! channels #(conj % channel))
      (println (str ">> NEW STUDENT CHANNEL (" (count @channels) " channel(s) total)"))
      (doseq [m @messages]
        (send! channel (:text m)))
      (on-close channel (fn [status]
                          (println ">> CLOSED: " status)
                          (swap! channels
                                 (fn [chs] (remove #(= channel %) chs)))))
      (on-receive channel (fn [data]
                            (let [message {:text data
                                           :user user
                                           :date (str (new java.util.Date))}]
                              (swap! messages
                                     (fn [m] (conj m message)))
                              (doseq [ch @channels]
                                (send! ch data))
                              (doseq [ch @teacher-channels]
                                (send! ch (json/write-str message)))))))))

(defn message-info-handler [request]
  (with-channel request channel
    (swap! teacher-channels #(conj % channel))
    (println (str ">> NEW TEACHER CHANNEL (" (count @teacher-channels) " channel(s) total)"))
    (doseq [m @messages]
      (send! channel (json/write-str m)))
    (on-close channel (fn [status]
                        (println ">> CLOSED TEACHER CHANNEL: " status)
                        (swap! teacher-channels
                               (fn [chs] (remove #(= channel %) chs)))))))

(defn wrap-auth [handler]
  (fn [request]
    (let [session-cookie (get (:cookies request) "session" "")
          username (get (:form-params request) "username")]
      (if (or (not= session-cookie "")
              (re-find #"/static" (:uri request)))
        (handler request)
        (if username
          (let [request-with-get (assoc-in request [:request-method] :get)
                response (handler request-with-get)]
            (assoc-in response [:cookies "session" :value] username))
          (file-response "resources/login.html"))))))

(defn is-teacher? [request]
  (let [session-cookie (get-in request [:cookies "session" :value])]
    (= session-cookie "teacher")))

(defn wrap-teacher-only [handler]
  (fn [request]
    (if (is-teacher? request)
      (handler request)
      (file-response "resources/denied.html"))))

(defn logout-handler [request]
  {:body "Goodbye!"
   :status 200
   :cookies (assoc-in (:cookies request) ["session" :max-age] 0)})

(defn index-page [request]
  (if (is-teacher? request)
    (file-response "resources/board.html")
    (file-response "resources/public/index.html")))

(defroutes app
  (GET "/" [] index-page)
  (GET "/chat" [] chat-handler)
  (GET "/messages" [] (wrap-teacher-only message-info-handler))
  (GET "/board" [] (wrap-teacher-only
                    (fn [r] (file-response "resources/board.html"))))
  (GET "/answers" [] (wrap-teacher-only
                      (fn [r] (file-response "resources/answers.html"))))
  (GET "/logout" [] logout-handler)
  (route/resources "/")
  (route/not-found "404 Not Found"))

(def wrapped-app
  (-> app
      wrap-auth
      wrap-params
      wrap-cookies))

(defn -main []
  (let [port 9090]
    (println (str "Starting server on http://localhost:" port))
    (run-server wrapped-app {:port port})))

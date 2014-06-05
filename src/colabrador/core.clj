(ns colabrador.core
  (:use org.httpkit.server)
  (:use [compojure.core :only (defroutes GET POST)])
  (:require [compojure.route :as route]
            [ring.middleware.cookies :refer [wrap-cookies]]
            [ring.middleware.params :refer [wrap-params]]
            [ring.util.response :refer [file-response redirect]])
  (:require [ring.middleware.file :refer [wrap-file]])
  (:gen-class))

(def messages (atom []))
(def channels (atom []))

(defn handler [request]
  (let [user (-> request :headers (get "user-agent"))]
    (println @messages)
    (with-channel request channel
      (swap! channels #(conj % channel))
      (println (str ">> NEW: " (count @channels) " channel(s) total"))
      (doseq [m @messages]
        (send! channel (:text m)))
      (on-close channel (fn [status]
                          (println ">> CLOSED: " status)
                          (swap! channels
                                 (fn [chs] (remove #(= channel %) chs)))))
      (on-receive channel (fn [data]
                            (swap! messages
                                   (fn [m] (conj m {:text data
                                                   :user user
                                                   :date (new java.util.Date)})))
                            (doseq [ch @channels]
                              (send! ch data)))))))

(defn wrap-auth [handler]
  (fn [request]
    (let [session-cookie (get (:cookies request) "session" "")
          username (get (:form-params request) "username")]
      (if (not= session-cookie "")
        (handler request)
        (if username
          (let [request-with-get (assoc-in request [:request-method] :get)
                response (handler request-with-get)]
            (println request-with-get)
            (println response)
            (assoc-in response [:cookies "session" :value] username))
          (file-response "resources/login.html"))))))

(defn logout-handler [request]
  {:body "Goodbye!"
   :status 200
   :cookies (assoc-in (:cookies request) ["session" :max-age] 0)})

(defroutes app
  (GET "/" [] (file-response "resources/public/index.html"))
  (GET "/chat" [] handler)
  (GET "/logout" [] logout-handler)
  (route/resources "/")
  (route/not-found "Not Found, motherfucker"))

(def wrapped-app
  (-> app
      wrap-auth
      wrap-params
      wrap-cookies))

(defn -main []
  (let [port 9090]
    (println (str "Starting server on http://localhost:" port))
    (run-server wrapped-app {:port port})))

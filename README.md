Instant collaborative board for the classroom
=============================================

This is the result of a two-day hackathon at Fronter/Pearson. The idea
was making a prototype of a tool to let a teacher ask a question in
class and get students to send their answers on the spot. The teacher
can then hook the computer to a projector and show the answers (with
the submitter's name or not), move them around with drag and drop to
group them, delete the ones that aren't relevant, and write summary
notes of the whole process.

After this, there's no persistence: all that work is just for that
particular moment and it's never saved.

Running
-------
You need a tool called [Leiningen](http://leiningen.org/) to run this
program. Download it, and then run `lein run` from this
directory. Once it's running you can go to a browser and open
http://localhost:9090.

You can kill the server at any moment pressing Ctrl-C. That will make
the server forget all submitted answers.


Shortcomings
------------
The current prototype has many shortcomings:

* There's no real authentication. Using `teacher` as your name will
  give you "teacher access", and using any other name
* The question is currently hardcoded.
* The HTML pages have many common parts that are currently duplicated.
* There are design issues in some mobile platforms.
* Changing from anonymous to public mode does not keep the position of
  the answers.
* The code in general could be improved.
* There's currently no "export" option for the result of the session.

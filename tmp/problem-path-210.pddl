;; problem file: problem-path-210.pddl
(define (problem default)
    (:domain default)
    (:objects me x0y0 x0y1 x0y2 x0y3 x0y4 x0y5 x0y6 x0y7 x0y8 x0y9 x1y0 x1y1 x1y2 x1y3 x1y4 x1y5 x1y6 x1y7 x1y8 x1y9 x2y0 x2y1 x2y2 x2y3 x2y4 x2y5 x2y6 x2y7 x2y8 x2y9 x3y0 x3y1 x3y2 x3y3 x3y4 x3y5 x3y6 x3y7 x3y8 x3y9 x4y0 x4y1 x4y2 x4y3 x4y4 x4y5 x4y6 x4y7 x4y8 x4y9 x5y0 x5y1 x5y2 x5y3 x5y4 x5y5 x5y6 x5y7 x5y8 x5y9 x6y0 x6y1 x6y2 x6y3 x6y4 x6y5 x6y6 x6y7 x6y8 x6y9 x7y0 x7y1 x7y2 x7y3 x7y4 x7y5 x7y6 x7y7 x7y8 x7y9 x8y0 x8y1 x8y2 x8y3 x8y4 x8y5 x8y6 x8y7 x8y8 x8y9 x9y0 x9y1 x9y2 x9y3 x9y4 x9y5 x9y6 x9y7 x9y8 x9y9)
    (:init (self me) (at me x7y6) (tile x0y0) (not (available x0y0)) (right x1y0 x0y0) (tile x0y1) (not (available x0y1)) (right x1y1 x0y1) (up x0y2 x0y1) (tile x0y2) (available x0y2) (right x1y2 x0y2) (tile x0y3) (not (available x0y3)) (right x1y3 x0y3) (down x0y2 x0y3) (up x0y4 x0y3) (tile x0y4) (available x0y4) (right x1y4 x0y4) (tile x0y5) (not (available x0y5)) (right x1y5 x0y5) (down x0y4 x0y5) (up x0y6 x0y5) (tile x0y6) (available x0y6) (right x1y6 x0y6) (tile x0y7) (not (available x0y7)) (right x1y7 x0y7) (down x0y6 x0y7) (tile x0y8) (not (available x0y8)) (right x1y8 x0y8) (tile x0y9) (not (available x0y9)) (right x1y9 x0y9) (tile x1y0) (available x1y0) (up x1y1 x1y0) (tile x1y1) (available x1y1) (down x1y0 x1y1) (up x1y2 x1y1) (tile x1y2) (available x1y2) (left x0y2 x1y2) (right x2y2 x1y2) (down x1y1 x1y2) (up x1y3 x1y2) (tile x1y3) (available x1y3) (down x1y2 x1y3) (up x1y4 x1y3) (tile x1y4) (available x1y4) (left x0y4 x1y4) (right x2y4 x1y4) (down x1y3 x1y4) (up x1y5 x1y4) (tile x1y5) (available x1y5) (down x1y4 x1y5) (up x1y6 x1y5) (tile x1y6) (available x1y6) (left x0y6 x1y6) (right x2y6 x1y6) (down x1y5 x1y6) (up x1y7 x1y6) (tile x1y7) (available x1y7) (down x1y6 x1y7) (up x1y8 x1y7) (tile x1y8) (available x1y8) (right x2y8 x1y8) (down x1y7 x1y8) (up x1y9 x1y8) (tile x1y9) (available x1y9) (down x1y8 x1y9) (tile x2y0) (not (available x2y0)) (left x1y0 x2y0) (tile x2y1) (not (available x2y1)) (left x1y1 x2y1) (up x2y2 x2y1) (tile x2y2) (available x2y2) (left x1y2 x2y2) (right x3y2 x2y2) (tile x2y3) (not (available x2y3)) (left x1y3 x2y3) (down x2y2 x2y3) (up x2y4 x2y3) (tile x2y4) (available x2y4) (left x1y4 x2y4) (right x3y4 x2y4) (tile x2y5) (not (available x2y5)) (left x1y5 x2y5) (down x2y4 x2y5) (up x2y6 x2y5) (tile x2y6) (available x2y6) (left x1y6 x2y6) (right x3y6 x2y6) (tile x2y7) (not (available x2y7)) (left x1y7 x2y7) (down x2y6 x2y7) (up x2y8 x2y7) (tile x2y8) (available x2y8) (left x1y8 x2y8) (right x3y8 x2y8) (tile x2y9) (not (available x2y9)) (left x1y9 x2y9) (right x3y9 x2y9) (down x2y8 x2y9) (tile x3y0) (not (available x3y0)) (tile x3y1) (not (available x3y1)) (up x3y2 x3y1) (tile x3y2) (available x3y2) (left x2y2 x3y2) (right x4y2 x3y2) (tile x3y3) (not (available x3y3)) (down x3y2 x3y3) (up x3y4 x3y3) (tile x3y4) (available x3y4) (left x2y4 x3y4) (right x4y4 x3y4) (tile x3y5) (not (available x3y5)) (down x3y4 x3y5) (up x3y6 x3y5) (tile x3y6) (available x3y6) (left x2y6 x3y6) (right x4y6 x3y6) (tile x3y7) (not (available x3y7)) (down x3y6 x3y7) (up x3y8 x3y7) (tile x3y8) (available x3y8) (left x2y8 x3y8) (up x3y9 x3y8) (tile x3y9) (available x3y9) (right x4y9 x3y9) (down x3y8 x3y9) (tile x4y0) (not (available x4y0)) (right x5y0 x4y0) (tile x4y1) (not (available x4y1)) (right x5y1 x4y1) (up x4y2 x4y1) (tile x4y2) (available x4y2) (left x3y2 x4y2) (right x5y2 x4y2) (tile x4y3) (not (available x4y3)) (right x5y3 x4y3) (down x4y2 x4y3) (up x4y4 x4y3) (tile x4y4) (available x4y4) (left x3y4 x4y4) (right x5y4 x4y4) (tile x4y5) (not (available x4y5)) (right x5y5 x4y5) (down x4y4 x4y5) (up x4y6 x4y5) (tile x4y6) (available x4y6) (left x3y6 x4y6) (right x5y6 x4y6) (tile x4y7) (not (available x4y7)) (right x5y7 x4y7) (down x4y6 x4y7) (tile x4y8) (not (available x4y8)) (left x3y8 x4y8) (right x5y8 x4y8) (up x4y9 x4y8) (tile x4y9) (available x4y9) (left x3y9 x4y9) (right x5y9 x4y9) (tile x5y0) (available x5y0) (right x6y0 x5y0) (up x5y1 x5y0) (tile x5y1) (available x5y1) (right x6y1 x5y1) (down x5y0 x5y1) (up x5y2 x5y1) (tile x5y2) (available x5y2) (left x4y2 x5y2) (right x6y2 x5y2) (down x5y1 x5y2) (up x5y3 x5y2) (tile x5y3) (available x5y3) (right x6y3 x5y3) (down x5y2 x5y3) (up x5y4 x5y3) (tile x5y4) (available x5y4) (left x4y4 x5y4) (right x6y4 x5y4) (down x5y3 x5y4) (up x5y5 x5y4) (tile x5y5) (available x5y5) (right x6y5 x5y5) (down x5y4 x5y5) (up x5y6 x5y5) (tile x5y6) (available x5y6) (left x4y6 x5y6) (right x6y6 x5y6) (down x5y5 x5y6) (up x5y7 x5y6) (tile x5y7) (available x5y7) (right x6y7 x5y7) (down x5y6 x5y7) (up x5y8 x5y7) (tile x5y8) (available x5y8) (right x6y8 x5y8) (down x5y7 x5y8) (up x5y9 x5y8) (tile x5y9) (available x5y9) (left x4y9 x5y9) (right x6y9 x5y9) (down x5y8 x5y9) (tile x6y0) (available x6y0) (left x5y0 x6y0) (up x6y1 x6y0) (tile x6y1) (available x6y1) (left x5y1 x6y1) (down x6y0 x6y1) (up x6y2 x6y1) (tile x6y2) (available x6y2) (left x5y2 x6y2) (right x7y2 x6y2) (down x6y1 x6y2) (up x6y3 x6y2) (tile x6y3) (available x6y3) (left x5y3 x6y3) (down x6y2 x6y3) (up x6y4 x6y3) (tile x6y4) (available x6y4) (left x5y4 x6y4) (down x6y3 x6y4) (up x6y5 x6y4) (tile x6y5) (available x6y5) (left x5y5 x6y5) (down x6y4 x6y5) (up x6y6 x6y5) (tile x6y6) (available x6y6) (left x5y6 x6y6) (right x7y6 x6y6) (down x6y5 x6y6) (up x6y7 x6y6) (tile x6y7) (available x6y7) (left x5y7 x6y7) (down x6y6 x6y7) (up x6y8 x6y7) (tile x6y8) (available x6y8) (left x5y8 x6y8) (down x6y7 x6y8) (up x6y9 x6y8) (tile x6y9) (available x6y9) (left x5y9 x6y9) (right x7y9 x6y9) (down x6y8 x6y9) (tile x7y0) (not (available x7y0)) (left x6y0 x7y0) (tile x7y1) (not (available x7y1)) (left x6y1 x7y1) (up x7y2 x7y1) (tile x7y2) (available x7y2) (left x6y2 x7y2) (right x8y2 x7y2) (tile x7y3) (not (available x7y3)) (left x6y3 x7y3) (down x7y2 x7y3) (tile x7y4) (not (available x7y4)) (left x6y4 x7y4) (right x8y4 x7y4) (tile x7y5) (not (available x7y5)) (left x6y5 x7y5) (right x8y5 x7y5) (up x7y6 x7y5) (tile x7y6) (available x7y6) (left x6y6 x7y6) (right x8y6 x7y6) (tile x7y7) (not (available x7y7)) (left x6y7 x7y7) (down x7y6 x7y7) (tile x7y8) (not (available x7y8)) (left x6y8 x7y8) (up x7y9 x7y8) (tile x7y9) (available x7y9) (left x6y9 x7y9) (right x8y9 x7y9) (tile x8y0) (not (available x8y0)) (tile x8y1) (not (available x8y1)) (up x8y2 x8y1) (tile x8y2) (available x8y2) (left x7y2 x8y2) (right x9y2 x8y2) (tile x8y3) (not (available x8y3)) (right x9y3 x8y3) (down x8y2 x8y3) (up x8y4 x8y3) (tile x8y4) (available x8y4) (right x9y4 x8y4) (up x8y5 x8y4) (tile x8y5) (available x8y5) (down x8y4 x8y5) (up x8y6 x8y5) (tile x8y6) (available x8y6) (left x7y6 x8y6) (right x9y6 x8y6) (down x8y5 x8y6) (tile x8y7) (not (available x8y7)) (down x8y6 x8y7) (tile x8y8) (not (available x8y8)) (up x8y9 x8y8) (tile x8y9) (available x8y9) (left x7y9 x8y9) (right x9y9 x8y9) (tile x9y0) (not (available x9y0)) (tile x9y1) (not (available x9y1)) (up x9y2 x9y1) (tile x9y2) (available x9y2) (left x8y2 x9y2) (up x9y3 x9y2) (tile x9y3) (available x9y3) (down x9y2 x9y3) (up x9y4 x9y3) (tile x9y4) (available x9y4) (left x8y4 x9y4) (down x9y3 x9y4) (tile x9y5) (not (available x9y5)) (left x8y5 x9y5) (down x9y4 x9y5) (up x9y6 x9y5) (tile x9y6) (available x9y6) (left x8y6 x9y6) (tile x9y7) (not (available x9y7)) (down x9y6 x9y7) (tile x9y8) (not (available x9y8)) (up x9y9 x9y8) (tile x9y9) (available x9y9) (left x8y9 x9y9))
    (:goal (at me x1y9))
)

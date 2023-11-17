;; domain file: domain.pddl
(define (domain default)
    (:requirements :strips)
    (:predicates
        (self ?s)
        (opponent ?a)
        (parcel ?p)
        (carried ?p) ; serve a capire se una parcel è un possibile obiettivo
        (carries ?a ?p) ; serve a capire se l'agent può consegnare quella parcel
        (tile ?t)
        (delivery ?t)
        (at ?aop ?t)
        (right ?t1 ?t2)
        (left ?t1 ?t2)
        (up ?t1 ?t2)
        (down ?t1 ?t2)
        (available ?t)
    )
    
    (:action move_right
        :parameters (?s ?from ?to)
        :precondition (and
            (self ?s)
            (tile ?from)
            (tile ?to)
            (available ?to)
            (at ?s ?from)
            (right ?from ?to)
        )
        :effect (and
            (available ?from)
            (not (available ?to))
            (at ?s ?to)
			(not (at ?s ?from))
        )
    )

    (:action move_left
        :parameters (?s ?from ?to)
        :precondition (and
            (self ?s)
            (tile ?from)
            (tile ?to)
            (available ?to)
            (at ?s ?from)
            (left ?from ?to)
        )
        :effect (and
            (available ?from)
            (not (available ?to))
            (at ?s ?to)
			(not (at ?s ?from))
        )
    )

    (:action move_up
        :parameters (?s ?from ?to)
        :precondition (and
            (self ?s)
            (tile ?from)
            (tile ?to)
            (available ?to)
            (at ?s ?from)
            (up ?from ?to)
        )
        :effect (and
            (available ?from)
            (not (available ?to))
            (at ?s ?to)
			(not (at ?s ?from))
        )
    )

    (:action move_down
        :parameters (?s ?from ?to)
        :precondition (and
            (self ?s)
            (tile ?from)
            (tile ?to)
            (available ?to)
            (at ?s ?from)
            (down ?from ?to)
        )
        :effect (and
            (available ?from)
            (not (available ?to))
            (at ?s ?to)
            (not (at ?s ?from))

        )
    )

    (:action grab
        :parameters (?s ?t ?p)
        :precondition (and
            (self ?s)
            (tile ?t)
            (at ?s ?t)
            (parcel ?p)
            (at ?p ?t)
        )
        :effect (and 
            (carries ?s ?p)
            (not (at ?p ?t))
        )
    )

    (:action deliver
        :parameters (?s ?t ?p)
        :precondition (and 
            (self ?s)
            (tile ?t)
            (at ?s ?t)
            (delivery ?t)
            (parcel ?p)
            (carries ?s ?p)
        )
        :effect (and
            (not (carries ?s ?p))
        )
    )
    
)
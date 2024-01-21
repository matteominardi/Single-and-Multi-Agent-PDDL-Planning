;; domain file: domain.pddl
(define (domain default)
    (:requirements :strips)
    (:predicates
        (self ?s)
        (parcel ?p)
        (tile ?t)
        (delivery ?t)
        (at ?aop ?t)
        (carries ?a ?p) ;; TODO: decide if this is needed
        (right ?t1 ?t2)
        (left ?t1 ?t2)
        (up ?t1 ?t2)
        (down ?t1 ?t2)
        (available ?t)
    )
    
    (:action right
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

    (:action left
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

    (:action up
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

    (:action down
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
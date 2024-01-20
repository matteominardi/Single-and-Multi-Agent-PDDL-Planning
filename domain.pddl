;; domain file: domain.pddl
(define (domain default)
    (:requirements :strips)
    (:predicates
        (self ?s) ; self s is our agent
        (parcel ?p) ; p is a parcel
        (carries ?s ?p) ; self s carries parcel p
        (tile ?t) ; t is a tile (TYPE 0)
        (delivery ?t) ; tile t is a delivery point (TYPE 1)
        (at ?sop ?t) ; self or parcel at tile t
        (right ?t1 ?t2) ; tile t1 is on the right of tile t2
        (left ?t1 ?t2) ; tile t1 is on the left of tile t2
        (up ?t1 ?t2) ; tile t1 is on the top of tile t2
        (down ?t1 ?t2) ; tile t1 is on the bottom of tile t2
        (available ?t) ; tile t is available (not occupied by another agent)
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
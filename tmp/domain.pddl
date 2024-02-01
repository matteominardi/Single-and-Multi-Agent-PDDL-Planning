;; domain file: domain.pddl
(define (domain default)
    (:requirements :strips)
    (:predicates
        (self ?s) ; self s is our agent
        (tile ?t) ; t is a tile
        (at ?s ?t) ; self or parcel at tile t
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
            (available ?from)
            (available ?to)
            (at ?s ?from)
            (right ?to ?from)
        )
        :effect (and
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
            (available ?from)
            (available ?to)
            (at ?s ?from)
            (left ?to ?from)
        )
        :effect (and
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
            (available ?from)
            (available ?to)
            (at ?s ?from)
            (up ?to ?from)
        )
        :effect (and
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
            (available ?from)
            (available ?to)
            (at ?s ?from)
            (down ?to ?from)
        )
        :effect (and
            (at ?s ?to)
            (not (at ?s ?from))

        )
    )
    
)
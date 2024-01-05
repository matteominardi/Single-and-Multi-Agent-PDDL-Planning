class Parcel {
    id;
    x;
    y;
    carriedBy;
    reward;

    constructor(id, x, y, carriedBy, reward) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.carriedBy = carriedBy;
        this.reward = reward;
    }
}

class Parcels extends Set {
    constructor() {
        super();
    }

    addParcel(parcel) {
        if (parcel instanceof Parcel) {
            this.add(parcel);
        } else {
            let newParcel = new Parcel(
                parcel.id,
                parcel.x,
                parcel.y,
                parcel.carriedBy,
                parcel.reward,
            );
            this.add(newParcel);
        }
    }

    getParcel(id) {
        for (let parcel of this) {
            if (parcel.id === id) {
                return parcel;
            }
        }
        return null;
    }

    updateParcel(newParcel) {
        for (let p of this) {
            if (p.id === newParcel.id) {
                p.x = newParcel.x;
                p.y = newParcel.y;
                p.carriedBy = newParcel.carriedBy;
                p.reward = newParcel.reward;
                return;
            }
        }
    }
}

export { Parcel, Parcels };

import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const client = new DeliverooApi(
    "http://localhost:8080/", 
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImU2NWNkOGUxN2NhIiwibmFtZSI6Im1hdHRlbyIsImlhdCI6MTY5NDc4NzQwNX0.YGxbrwq4nLcgjFz0BcNCtOsLFo6RL548ukbCAWB50sI"
)

client.move("up");

client.socket.on("you", (me) => {
    console.log(me);
});
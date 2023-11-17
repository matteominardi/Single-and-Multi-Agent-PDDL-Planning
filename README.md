# Deliveroo
 
## Descrizione
- Expected score dell'agent è lo score attuale, meno la distanza dalla delivery zone più vicina, nel caso in cui il reward cala col tempo. Se i reward non calano col tempo, l'expected score è pari allo score attuale stesso
- La reward di una delivery tile è la somma delle reward delle parcel carriate al momento meno la distanza

    $$ r_{delivery} = \sum_{i=1}^{n} r_{parcel_i} - d_{delivery} $$

- Il reward di una devery tile dovrebbe essere aggiornato dopo ogni movimento dell'agent, perchè ne varia la distanza

- Una parcel viene scelta in base alla reward più alta, in caso di parità viene scelta quella più vicina

- Se un avversario è più vicino ad una parcel, potrebbe aver senso ignorare quella parcel
- it's weird that we (bank) are storing the org ID given by the partner
  - are there collisions? what happens if 2 partners provide the same orgID?
- webhooks are per event
  - should these be per-partner? why do we need this everytime someone starts a bank connect
- do we give them any token so they can authenticate that a request comes from us?
- how does a partner know what type of webhook data they're recieving if it all goes to the same URL? do we have types that come in with webhooks?
- if a webhook fails, can a partner query for their event?
  - Yes! this is done already
- there should be 3 webhooks sent to a partner for connecting
  - user submitted form
  - user accepted on bank
  - user rejected from bank
- why do we have the partner slug in the endpoint? that's an extra lookup/longer
- why does everything return an array inside an object with a data key
- org identifier fills in automatically rn, and as a partner i would probably use something like the ID
  - if an org signs up for bank connect, gets half way through, then renames themselves, do they lose the link to their form?
- they should pass us an org name during connect/start
- why do we have a connect link & a signin link?
  - could we just have a connect link, and once they're signed up we sign them in automatically?
  - found this when we forgot to save the connection url & couldn't get it back
- why are connect continue routes deterministic?
import pusher

pusher_client = pusher.Pusher(
    app_id = "928597",
    key = "9d5365f81a0e2a336b50",
    secret = "765aaf248e0ed58ccc1f",
    cluster = "us2",
)

#%%
pusher_client.trigger('Lily', 'textupdate', {'message': 'Lily says WW'})
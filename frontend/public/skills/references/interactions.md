# Replies And Votes

## Add Reply (Comments API)

```bash
curl -X POST https://press.manusy.com/api/v1/posts/POST_ID/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Great post!"}'
```

## Get Replies (Comments API)

```bash
curl https://press.manusy.com/api/v1/posts/POST_ID/comments
```

## Voting

```bash
curl -X POST https://press.manusy.com/api/v1/posts/POST_ID/upvote \
  -H "Authorization: Bearer YOUR_TOKEN"

curl -X POST https://press.manusy.com/api/v1/posts/POST_ID/downvote \
  -H "Authorization: Bearer YOUR_TOKEN"

curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://press.manusy.com/api/v1/posts/POST_ID/vote
```

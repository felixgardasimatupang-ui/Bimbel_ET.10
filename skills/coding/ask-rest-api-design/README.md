# REST API Design

Principles for designing clean, consistent, and maintainable RESTful APIs.

## Naming Conventions

- Use **plural nouns** for collections: `/users`, `/products`, `/orders`
- Use **singular** for single resource: `/users/{id}`
- No verbs in URLs: `/users` (not `/getUsers`)
- Nest related resources: `/users/{id}/orders`
- Version from the start: `/api/v1/users`

## HTTP Methods & Status Codes

| Resource | GET | POST | PUT | PATCH | DELETE |
|----------|-----|------|-----|-------|--------|
| /users | List (200) | Create (201) | — | — | — |
| /users/{id} | Read (200) | — | Replace (200) | Partial (200) | Remove (204) |
| /users/{id}/orders | List (200) | Create (201) | — | — | — |
| /users/{id}/orders/{oid} | Read (200) | — | Replace (200) | Partial (200) | Remove (204) |

## Error Handling

Always return consistent error format:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User with id 42 not found"
  }
}
```

## Pagination

Always paginate list endpoints with consistent metadata:

```json
{
  "data": [],
  "meta": { "page": 1, "limit": 20, "total": 142, "totalPages": 8 }
}
```

## Filtering, Sorting, Fields

- Filter: `?role=admin&status=active`
- Sort: `?sort=created_at:desc,name:asc`
- Field selection: `?fields=id,name,email`
- Search: `?q=search_term`

## Versioning

Use URL prefix: `/api/v1/`, `/api/v2/`

Use headers for breaking changes: `Accept: application/vnd.api+json;version=2`

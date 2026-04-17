# SQL Formatter

Format and prettify SQL queries with proper indentation and uppercase keywords. Supports multiple SQL dialects.

## Dialects

| Dialect | Use for |
|---------|---------|
| SQL | Generic ANSI SQL |
| PostgreSQL | Postgres-specific syntax (e.g. `::` cast, `$$` blocks) |
| MySQL | MySQL / MariaDB |
| SQLite | Lightweight SQLite queries |
| BigQuery | Google BigQuery standard SQL |

## What it does

- Uppercases SQL keywords (`SELECT`, `FROM`, `WHERE`, `JOIN`, etc.)
- Adds newlines and indentation for readability
- Normalizes spacing around operators and commas

## Example

Input:
```sql
select u.id,u.name,count(o.id) as order_count from users u left join orders o on o.user_id=u.id where u.created_at>'2024-01-01' group by u.id,u.name order by order_count desc limit 25
```

Output:
```sql
SELECT
  u.id,
  u.name,
  COUNT(o.id) AS order_count
FROM
  users u
  LEFT JOIN orders o ON o.user_id = u.id
WHERE
  u.created_at > '2024-01-01'
GROUP BY
  u.id,
  u.name
ORDER BY
  order_count DESC
LIMIT
  25
```

# Manual Testing

## Setup

I've setup a structure like the following:

- Kanban Test/
    - To Do/
        - Test Note.md
    - In Progress/
    - Complete/
    - Kanban Test.base

The Kanban Test.base has our new Kanban view selected.

I've added a filter:

```
folder starts with "Kanban Test"
```

## Expected

Simple columns for the state folders, listing divs with Test Note in the To Do
folder

## Actual

Just two items are rendered:

```
Kanban Test
Kanban Test
```

Can you identify what is happening and how to improve it?

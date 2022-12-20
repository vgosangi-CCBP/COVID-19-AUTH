const express = require("express");
const path = require("path");

const { format, isValid } = require("date-fns");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const authorization = (request, response, next) => {
  const {
    status = "",
    priority = "",
    category = "",
    date = "",
  } = request.query;

  let dateValidate;
  if (date !== "") {
    dateValidate = isValid(new Date(date));
  } else {
    dateValidate = true;
  }

  if (
    priority !== "HIGH" &&
    priority !== "MEDIUM" &&
    priority !== "LOW" &&
    priority !== ""
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    status !== "TO DO" &&
    status !== "IN PROGRESS" &&
    status !== "DONE" &&
    status !== ""
  ) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    category !== "WORK" &&
    category !== "HOME" &&
    category !== "LEARNING" &&
    category !== ""
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (dateValidate !== true) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    next();
  }
};

const authorization2 = (request, response, next) => {
  const {
    status = "",
    priority = "",
    category = "",
    dueDate = "",
  } = request.body;
  let dateValidate;
  if (dueDate !== "") {
    dateValidate = isValid(new Date(dueDate));
  } else {
    dateValidate = true;
  }
  if (
    priority !== "HIGH" &&
    priority !== "MEDIUM" &&
    priority !== "LOW" &&
    priority !== ""
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    status !== "TO DO" &&
    status !== "IN PROGRESS" &&
    status !== "DONE" &&
    status !== ""
  ) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    category !== "WORK" &&
    category !== "HOME" &&
    category !== "LEARNING" &&
    category !== ""
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (dateValidate !== true) {
    response.status(400);
    response.send("Invalid Todo dueDate");
  } else {
    next();
  }
};

//API 1
app.get("/todos/", authorization, async (request, response) => {
  let list = [];
  let x;
  const {
    priority = "",
    status = "",
    category = "",
    date = "",
    search_q = "",
  } = request.query;
  console.log(request.query);
  if (priority !== "") {
    x = `priority = '${priority}'`;
    list.push(x);
  }
  if (status !== "") {
    x = `status = '${status}' `;
    list.push(x);
  }
  if (category !== "") {
    x = `category ='${category}' `;
    list.push(x);
  }
  if (date !== "") {
    x = `due_date = '${date}' `;
    list.push(x);
  }
  if (search_q !== "") {
    x = `todo like '%${search_q}%' `;
    list.push(x);
  }
  let where = list.join(" and ");
  console.log(where);
  const getTodoQuery = `
    SELECT
      id,todo,priority,status,category,due_date as dueDate
    FROM
      todo 
    where 
         ${where}`;
  console.log(getTodoQuery);
  const todoArray = await db.all(getTodoQuery);
  response.send(todoArray);
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT
      id,todo,priority,status,category,due_date as dueDate
    FROM
      todo 
    where
      id=${todoId};`;
  const todoArray = await db.get(getTodoQuery);
  response.send(todoArray);
});
//API 3
app.get("/agenda/", authorization, async (request, response) => {
  const { date } = request.query;
  const formDate = format(new Date(date), "yyyy-MM-dd");
  console.log(formDate);
  const getTodoQuery = `
    SELECT
      id,todo,priority,status,category,due_date as dueDate
    FROM
      todo 
    where
      due_date='${formDate}';`;
  const todoArray = await db.all(getTodoQuery);
  response.send(todoArray);
});

//API 4
app.post("/todos/", authorization2, async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;

  const addTodoQuery = `
    INSERT INTO
      todo (id,todo,priority,status,category,due_date)
    VALUES
      (
        ${id},
        '${todo}',
        ' ${priority}',
         '${status}',
         '${category}',
         '${dueDate}' 
      );`;

  const dbResponse = await db.run(addTodoQuery);

  response.send("Todo Successfully Added");
});

//API 5
app.put("/todos/:todoId/", authorization2, async (request, response) => {
  const { todoId } = request.params;
  const {
    todo = "",
    status = "",
    priority = "",
    category = "",
    dueDate = "",
  } = request.body;

  let todoToUpdated = "";
  let todoItem = "";
  let todoItemInfo;
  switch (true) {
    case status !== "":
      todoItem = "status";
      todoToUpdated = status;
      todoItemInfo = "Status";
      break;
    case todo !== "":
      todoItem = "todo";
      todoToUpdated = todo;
      todoItemInfo = "Todo";
      break;
    case priority !== "":
      todoItem = "priority";
      todoToUpdated = priority;
      todoItemInfo = "Priority";
      break;
    case category !== "":
      todoItem = "category";
      todoToUpdated = category;
      todoItemInfo = "Category";
      break;
    case dueDate !== "":
      todoItem = "due_date";
      todoToUpdated = dueDate;
      todoItemInfo = "Due Date";
      break;
  }
  console.log(todoItem, todoToUpdated);
  const updateTodoQuery = `
      update
        todo
     SET
         ${todoItem}= "${todoToUpdated}"
    WHERE
        id = ${todoId};
        `;
  console.log(updateTodoQuery);
  const dbResponse = await db.run(updateTodoQuery);

  response.send(`${todoItemInfo} Updated`);
});

//API 6

app.delete(
  "/todos/:todoId/",

  async (request, response) => {
    const { todoId } = request.params;
    const deleteTodoQuery = `
    DELETE FROM
      todo
    WHERE
        id = ${todoId};`;
    await db.run(deleteTodoQuery);
    response.send("Todo Deleted");
  }
);
module.exports = app;

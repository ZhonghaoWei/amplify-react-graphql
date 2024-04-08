import React, { useState, useEffect } from "react";
import "./App.css";
import "@aws-amplify/ui-react/styles.css";
import { generateClient } from "aws-amplify/api";
//import { Amplify } from 'aws-amplify';
import { getUrl } from "aws-amplify/storage";
import { remove } from "aws-amplify/storage";
import { uploadData } from "aws-amplify/storage";
import {
  Button,
  Flex,
  Heading,
  Text,
  TextField,
  View,
  withAuthenticator,
} from "@aws-amplify/ui-react";
import { listTodos } from "./graphql/queries";
import {
  createTodo as createTodoMutation,
  deleteTodo as deleteTodoMutation,
} from "./graphql/mutations";

const client = generateClient();

const App = ({ signOut }) => {
  const [notes, setTodos] = useState([]);

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    const apiData = await client.graphql({ query: listTodos });
    const notesFromclient = apiData.data.listTodos.items;
    await Promise.all(
      notesFromclient.map(async (note) => {
        if (note.image) {
          const url = await getUrl(note.name);
          note.image = url;
        }
        return note;
      })
    );
    setTodos(notesFromclient);
  }

  async function createTodo(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const image = form.get("image");
    const data = {
      name: form.get("name"),
      description: form.get("description"),
      image: image?.name,
    };

    console.log("data", data);
    if (!!data.image) uploadData(data.name, image);
    await client.graphql({
      query: createTodoMutation,
      variables: { input: data },
    });
    fetchTodos();
    event.target.reset();
  }

  async function deleteTodo({ id, name }) {
    const newTodos = notes.filter((note) => note.id !== id);
    setTodos(newTodos);
    await remove({ name });
    await client.graphql({
      query: deleteTodoMutation,
      variables: { input: { id } },
    });
  }

  return (
    <>
      <View name="image" as="input" type="file" style={{ alignSelf: "end" }} />
      <View className="App">
        <Heading level={1}>My Todos App</Heading>
        <View as="form" margin="3rem 0" onSubmit={createTodo}>
          <Flex direction="row" justifyContent="center">
            <TextField
              name="name"
              placeholder="Note Name"
              label="Note Name"
              labelHidden
              variation="quiet"
              required
            />
            <TextField
              name="description"
              placeholder="Note Description"
              label="Note Description"
              labelHidden
              variation="quiet"
              required
            />
            <Button type="submit" variation="primary">
              Create Note
            </Button>
          </Flex>
        </View>
        <Heading level={2}>Current Todos</Heading>
        <View margin="3rem 0">
          {notes.map((note) => (
            <Flex
              key={note.id || note.name}
              direction="row"
              justifyContent="center"
              alignItems="center"
            >
              <Text as="strong" fontWeight={700}>
                {note.name}
              </Text>
              <Text as="span">{note.description}</Text>
              {/* {note.image && (
      <Image
        src={note.image}
        alt={`visual aid for ${notes.name}`}
        style={{ width: 400 }}
      />
    )} */}
              {/* <Button variation="link" onClick={() => deleteNote(note)}>
      Delete note
    </Button> */}
            </Flex>
          ))}
        </View>
        <Button onClick={signOut}>Sign Out</Button>
      </View>
    </>
  );
};

export default withAuthenticator(App);

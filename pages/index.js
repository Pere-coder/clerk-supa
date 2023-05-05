import { useAuth, useUser, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useSession } from "@clerk/nextjs";



import { createClient } from "@supabase/supabase-js";

const supabaseClient = async (supabaseAccessToken) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_KEY,
    {
      global: { headers: { Authorization: `Bearer ${supabaseAccessToken}` } },
    }
  );

  return supabase;
};

export default function Home() {
  const { isSignedIn, isLoading, user } = useUser();
  const [todos, setTodos] = useState(null);
  
  return (
    <>
      <Header />
      {isLoading ? (
        <></>
      ) : (
        <main >
          <div >
            {isSignedIn ? (
              <>
                <span >Welcome {user.firstName}!</span>
                // Add your AddTodoForm here!
                <AddTodoForm todos={todos} setTodos={setTodos} />
                <TodoList todos={todos} setTodos={setTodos} /> 
              </>
            ) : (
              <div >
                Sign in to create your todo list!
              </div>
            )}
          </div>
        </main>
      )}
    </>
  );
}

const Header = () => {
  const { isSignedIn } = useUser();

  return (
    <header>
      <div>My Todo App</div>
      {isSignedIn ? (
        <UserButton />
      ) : (
        <div>
          <SignInButton />
          &nbsp;
          <SignUpButton />
        </div>
      )}
    </header>
  );
};


const TodoList = ({ todos, setTodos }) => {
  const { session } = useSession();
  const [loading, setLoading] = useState(true);

  // on first load, fetch and set todos
  useEffect(() => {
    const loadTodos = async () => {
      try {
        setLoading(true);
        const supabaseAccessToken = await session.getToken({
          template: "supabase",
        });
        const supabase = await supabaseClient(supabaseAccessToken);
        const { data: todos } = await supabase.from("todos").select("*");
        setTodos(todos);
      } catch (e) {
        alert(e);
      } finally {
        setLoading(false);
      }
    };
    loadTodos();
  }, []);

  // if loading, just show basic message
  if (loading) {
    return <div >Loading...</div>;
  }

  // display all the todos
  return (
    <>
      {todos?.length > 0 ? (
        <div>
          <ol>
            {todos.map((todo) => (
              <li key={todo.id}>{todo.title}</li>
            ))}
          </ol>
        </div>
      ) : (
        <div>You don't have any todos!</div>
      )}
    </>
  );
};

function AddTodoForm({ todos, setTodos }) {
  const { getToken, userId } = useAuth();
  const [newTodo, setNewTodo] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newTodo === "") {
      return;
    }

    const supabaseAccessToken = await getToken({
      template: "supabase",
    });
    const supabase = await supabaseClient(supabaseAccessToken);
    const { data } = await supabase
      .from("todos")
      .insert({ title: newTodo, user_id: userId })
      .select()
      
    setTodos([...todos, data[0]]);
    setNewTodo("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <input onChange={(e) => setNewTodo(e.target.value)} value={newTodo} />
      &nbsp;<button>Add Todo</button>
    </form>
  );
}
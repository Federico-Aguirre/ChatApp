import { useState } from "react";
import { Chat } from "./Chat.jsx";
import { Auth } from "./Login.jsx";
import { AppWrapper } from "./AppWrapper.jsx";
import Cookies from "universal-cookie";
import "../../styles/App.css";

const cookies = new Cookies();

function App() {
  const [isAuth, setIsAuth] = useState(cookies.get("auth-token"));
  const [isInChat, setIsInChat] = useState(null);
  const [room, setRoom] = useState("");

  if (!isAuth) {
    return (
      <AppWrapper
        isAuth={isAuth}
        setIsAuth={setIsAuth}
        setIsInChat={setIsInChat}
      >
        <Auth setIsAuth={setIsAuth} />
      </AppWrapper>
    );
  }

  return (
    <AppWrapper isAuth={isAuth} setIsAuth={setIsAuth} setIsInChat={setIsInChat}>
      {!isInChat ? (
        <div className="room">
          <label> Type room name: </label>
          <input onChange={(e) => setRoom(e.target.value)} />
          <button
            onClick={() => {
              setIsInChat(true);
            }}
          >
            Enter chat
          </button>
        </div>
      ) : (
        <div className="room-container">
          <div className="room-history"></div>
          <Chat room={room} />
        </div>
      )}
    </AppWrapper>
  );
}

export default App;
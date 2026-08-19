import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./store";
import { fetchChannels, fetchUsers } from "./store/slices/chatSlice";
import { Sidebar } from "./components/sidebar/Sidebar";
import { Chat } from "./components/Chat";
import { Auth } from "./components/Login";
import { AppWrapper } from "./components/AppWrapper";

function App() {
  const dispatch = useAppDispatch();
  const { token, currentUser } = useAppSelector((state) => state.auth);

  const userId = currentUser?._id || (currentUser as unknown as { id: string })?.id;

  useEffect(() => {
    if (token && userId) {
      dispatch(fetchChannels(userId));
      dispatch(fetchUsers());
    }
  }, [token, userId, dispatch]);

  if (!token) {
    return (
      <AppWrapper isAuth={false}>
        <Auth setToken={() => {}} />
      </AppWrapper>
    );
  }

  return (
    <AppWrapper isAuth={true}>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-900 font-sans">
        <Sidebar />
        <Chat />
      </div>
    </AppWrapper>
  );
}

export default App;
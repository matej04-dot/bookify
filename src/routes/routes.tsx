import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/home";
import BookDetails from "../pages/bookDetails";
import BooksList from "../pages/booksList";
import Login from "../pages/loginPage";
import AccountDetails from "@/pages/accountDetails";
import AdminPanelPage from "@/pages/adminPanel";
import AdminReviewList from "@/pages/adminReviewsList";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    errorElement: <div>Page not found</div>,
  },
  {
    path: "bookDetails/:bookKey",
    element: <BookDetails />,
  },
  {
    path: "/search",
    element: <BooksList />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/account",
    element: <AccountDetails />,
  },
  {
    path: "/adminPanel",
    element: <AdminPanelPage />,
  },
  {
    path: "/admin/users/:userId",
    element: <AdminReviewList />,
  },
]);

export default router;

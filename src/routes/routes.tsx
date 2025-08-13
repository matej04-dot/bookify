import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/home";
import BookDetails from "../pages/bookDetails";
import BooksList from "../pages/booksList";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    errorElement: <div>Page not found</div>,
  },
  {
    path: "/:bookKey",
    element: <BookDetails />,
  },
  {
    path: "/search",
    element: <BooksList />,
  },
]);

export default router;

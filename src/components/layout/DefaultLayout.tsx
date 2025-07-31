import Navbar from "../Navbar";
import Footer from "../Footer";

interface LayoutProps {
  children: React.ReactNode;
}

function DefaultLayout({ children }: LayoutProps) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

export default DefaultLayout;

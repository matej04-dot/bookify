import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { act } from "react";
import BookCardLarge from "./BookCardLarge";
import userEvent from "@testing-library/user-event";

jest.mock("@/utils/Constants", () => ({
  imagesBaseUrl: "https://covers.example",
}));

jest.mock("../firebase-config", () => ({
  db: {},
}));

const getDocMock = jest.fn();
const docMock = jest.fn();

jest.mock("firebase/firestore", () => ({
  doc: (...args: any[]) => docMock(...args),
  getDoc: (...args: any[]) => getDocMock(...args),
}));

jest.mock("./Rating", () => {
  return {
    __esModule: true,
    default: ({ value, readOnly }: any) => (
      <div
        data-testid="star-rating"
        data-value={String(value)}
        data-readonly={String(readOnly)}
      />
    ),
  };
});

describe("BookCardLarge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders title, authors and uses cover_edition_key to build image src", async () => {
    const book = {
      key: "/works/OL123W",
      title: "Test Book",
      authors: [{ name: "Alice" }, { name: "Bob" }],
      cover_edition_key: "OL-COVER-1",
    };

    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({ total: 45, count: 9 }),
    });

    const { container } = render(<BookCardLarge book={book} />);

    expect(screen.getByText(book.title)).toBeInTheDocument();
    expect(screen.getByText(/by/i)).toBeInTheDocument();
    expect(screen.getByText(/Alice, Bob/)).toBeInTheDocument();

    const img = await screen.findByAltText(`Cover for ${book.title}`);
    expect((img as HTMLImageElement).getAttribute("src")).toBe(
      "https://covers.example/b/olid/OL-COVER-1-M.jpg"
    );

    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();

    await act(async () => {
      fireEvent.load(img);
    });
    await waitFor(() => {
      expect(container.querySelector(".animate-spin")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/Rating:/)).toBeInTheDocument();
      expect(screen.getByTestId("star-rating")).toHaveAttribute(
        "data-value",
        "5"
      );
    });
  });

  it("shows 'Unknown Author' when authors are missing", async () => {
    const book = { key: "/works/OLX", title: "No Author Book" };
    getDocMock.mockResolvedValue({
      exists: () => false,
      data: () => ({}),
    });

    render(<BookCardLarge book={book as any} />);

    await screen.findByText(/Unknown Author/);
    await screen.findByText(/No ratings yet/);
  });

  it("displays loading rating while fetching and handles no ratings", async () => {
    const book = { key: "/works/OLNO", title: "Loading Rating" };
    let resolveSnap: (v: any) => void;
    const snapPromise = new Promise((res) => (resolveSnap = res));
    getDocMock.mockReturnValue(snapPromise);

    render(<BookCardLarge book={book as any} />);

    await screen.findByText("Loading rating...");

    await act(async () => {
      resolveSnap!({
        exists: () => false,
        data: () => ({}),
      });
    });
    await waitFor(() => {
      expect(screen.getByText("No ratings yet")).toBeInTheDocument();
    });
  });

  it("calls onClick when container is clicked", async () => {
    const book = { key: "/works/OLCLICK", title: "Clickable Book" };
    getDocMock.mockResolvedValue({
      exists: () => false,
      data: () => ({}),
    });
    const onClick = jest.fn();
    const { container } = render(
      <BookCardLarge book={book as any} onClick={onClick} />
    );

    const root = container.firstChild as Element;
    await userEvent.click(root); // automatski koristi act
    expect(onClick).toHaveBeenCalled();
  });
});

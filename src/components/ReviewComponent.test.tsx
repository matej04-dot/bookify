"use client";

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ReviewComponent from "./ReviewComponent";

const addReviewMock = jest.fn();

jest.mock("../services/reviews", () => ({
  addReview: (...args: any[]) => addReviewMock(...args),
}));

jest.mock("../firebase-config", () => ({
  auth: { currentUser: null },
}));

jest.mock("react-router-dom", () => ({
  useParams: () => ({}),
}));

jest.mock("./Rating", () => {
  return {
    __esModule: true,
    default: ({ value, onChange }: any) => (
      <input
        data-testid="star-rating"
        value={String(value)}
        onChange={(e) => onChange(Number((e.target as HTMLInputElement).value))}
      />
    ),
  };
});

describe("ReviewComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const firebaseMock = jest.requireMock("../firebase-config") as any;
    firebaseMock.auth.currentUser = null;
    const rr = jest.requireMock("react-router-dom") as any;
    rr.useParams = () => ({});
  });

  it("shows 'Not authenticated' when user not signed in", async () => {
    const rr = jest.requireMock("react-router-dom") as any;
    rr.useParams = () => ({ bookId: "book-1" });
    render(<ReviewComponent />);

    fireEvent.click(screen.getByText("Submit Review"));
    await screen.findByText("Not authenticated");
  });

  it("shows 'Missing book id' when no route param provided", async () => {
    const firebaseMock = jest.requireMock("../firebase-config") as any;
    firebaseMock.auth.currentUser = { uid: "u1", displayName: "User" };
    const rr = jest.requireMock("react-router-dom") as any;
    rr.useParams = () => ({});
    render(<ReviewComponent />);

    fireEvent.change(screen.getByTestId("star-rating"), {
      target: { value: "4" },
    });
    fireEvent.click(screen.getByText("Submit Review"));

    await screen.findByText("Missing book id");
    expect(addReviewMock).not.toHaveBeenCalled();
  });

  it("shows validation when rating not provided", async () => {
    const firebaseMock = jest.requireMock("../firebase-config") as any;
    firebaseMock.auth.currentUser = { uid: "u2", displayName: "User2" };
    const rr = jest.requireMock("react-router-dom") as any;
    rr.useParams = () => ({ bookId: "book-2" });
    render(<ReviewComponent />);

    fireEvent.click(screen.getByText("Submit Review"));

    await screen.findByText("Please provide a rating");
    expect(addReviewMock).not.toHaveBeenCalled();
  });

  it("submits review and calls onClose on success", async () => {
    const firebaseMock = jest.requireMock("../firebase-config") as any;
    firebaseMock.auth.currentUser = {
      uid: "u3",
      displayName: "Alice",
      email: "alice@example.com",
    };
    const rr = jest.requireMock("react-router-dom") as any;
    rr.useParams = () => ({ bookId: "book-3" });
    addReviewMock.mockResolvedValueOnce(undefined);
    const onClose = jest.fn();

    render(<ReviewComponent onClose={onClose} bookName="My Book" />);

    fireEvent.change(screen.getByTestId("star-rating"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("Comment"), {
      target: { value: "Nice book!" },
    });

    const btn = screen.getByRole("button", { name: /submit review/i });
    fireEvent.click(btn);

    await waitFor(() => expect(addReviewMock).toHaveBeenCalledTimes(1));

    const payload = addReviewMock.mock.calls[0][0];
    expect(payload).toMatchObject({
      userId: "u3",
      bookId: "book-3",
      rating: 5,
      comment: "Nice book!",
      username: "Alice",
      bookName: "My Book",
    });

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

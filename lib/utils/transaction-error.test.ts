import { describe, expect, it } from "vitest";
import { friendlyTransactionError } from "./transaction-error";

describe("friendlyTransactionError", () => {
  it("uses registration-specific copy for a registerEvent revert", () => {
    const error = Object.assign(new Error("execution reverted"), {
      shortMessage: "The contract function registerEvent reverted.",
    });

    expect(friendlyTransactionError(error, "registerEvent")).toBe(
      "The registration check failed. Confirm Base Sepolia is selected and try again. If it repeats, review the event details.",
    );
  });

  it("keeps mint-specific guidance for a mint revert", () => {
    const error = new Error("The contract function mint reverted.");

    expect(friendlyTransactionError(error, "mint")).toBe(
      "The contract rejected this transaction. Check the wallet's eligibility and the selected mint method.",
    );
  });

  it("finds a temporary network failure in a nested cause", () => {
    const cause = new Error("HTTP 429: too many requests");
    const error = Object.assign(new Error("ContractFunctionExecutionError"), {
      cause,
    });

    expect(friendlyTransactionError(error, "registerEvent")).toBe(
      "Base Sepolia or the wallet did not respond. Check wallet activity, then try again.",
    );
  });

  it("warns before retrying a transaction that may already exist", () => {
    const error = new Error("nonce too low");

    expect(friendlyTransactionError(error, "registerEvent")).toBe(
      "The wallet may already have submitted this transaction. Check its activity before trying again.",
    );
  });
});

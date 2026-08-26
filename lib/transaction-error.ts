export function friendlyTransactionError(
  error: Error,
  functionName?: string,
) {
  const message = collectErrorMessages(error);

  if (/insufficient funds|exceeds.*balance|not enough funds/i.test(message))
    return "This wallet does not have enough Base Sepolia ETH to pay network gas.";
  if (/user rejected|user denied|rejected the request/i.test(message))
    return "Transaction cancelled in the wallet.";
  if (/chain mismatch|wrong network|unsupported chain|current chain.*does not match/i.test(message))
    return "Switch the wallet to Base Sepolia and try again.";
  if (/already pending|already processing|resource unavailable|-32002/i.test(message))
    return "The wallet already has a request open. Complete or cancel it before trying again.";
  if (/nonce too low|replacement transaction underpriced|already known/i.test(message))
    return "The wallet may already have submitted this transaction. Check its activity before trying again.";
  if (/timeout|timed out|rate limit|too many requests|failed to fetch|network error|disconnected|gateway/i.test(message))
    return "Base Sepolia or the wallet did not respond. Check wallet activity, then try again.";
  if (/already claimed|already minted/i.test(message))
    return "This wallet has already claimed this POAP.";
  if (/contract function .* reverted|execution reverted/i.test(message)) {
    if (functionName === "registerEvent")
      return "The registration check failed. Confirm Base Sepolia is selected and try again. If it repeats, review the event details.";
    return "The contract rejected this transaction. Check the wallet's eligibility and the selected mint method.";
  }

  return firstUsefulLine(message) || "The transaction could not be prepared.";
}

function collectErrorMessages(error: Error) {
  const messages: string[] = [];
  const visited = new Set<unknown>();
  let current: unknown = error;

  while (current && typeof current === "object" && !visited.has(current)) {
    visited.add(current);
    const candidate = current as {
      shortMessage?: unknown;
      details?: unknown;
      message?: unknown;
      cause?: unknown;
    };

    for (const value of [
      candidate.shortMessage,
      candidate.details,
      candidate.message,
    ]) {
      if (typeof value === "string" && value.trim() && !messages.includes(value))
        messages.push(value);
    }
    current = candidate.cause;
  }

  return messages.join("\n");
}

function firstUsefulLine(message: string) {
  return message
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && !/^details:|^version:|^request arguments:/i.test(line));
}

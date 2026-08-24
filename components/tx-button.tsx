"use client";
import { useEffect, useRef } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import type { ContractFunctionArgs, ContractFunctionName } from "viem";
import type { TransactionReceipt } from "viem";
import { poapAbi } from "@/lib/abi";
import { CONTRACT, explorer } from "@/lib/constants";
export function TxButton<
  T extends ContractFunctionName<typeof poapAbi, "nonpayable">,
>({
  name,
  args,
  label,
  disabled,
  onSuccess,
  wide = true,
  variant = "primary",
  showSuccess = true,
}: {
  name: T;
  args: ContractFunctionArgs<typeof poapAbi, "nonpayable", T>;
  label: string;
  disabled?: boolean;
  onSuccess?: (receipt: TransactionReceipt) => void;
  wide?: boolean;
  variant?: "primary" | "secondary";
  showSuccess?: boolean;
}) {
  const { writeContract, data, error, isPending } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash: data });
  const notifiedHash = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!receipt.isSuccess || !data || notifiedHash.current === data) return;
    notifiedHash.current = data;
    if (receipt.data) onSuccess?.(receipt.data);
  }, [data, onSuccess, receipt.data, receipt.isSuccess]);
  if (receipt.isSuccess && !showSuccess) return null;
  if (receipt.isSuccess)
    return (
      <div className="success">
        Confirmed onchain ·{" "}
        <a target="_blank" rel="noreferrer" href={explorer(`tx/${data}`)}>
          View transaction ↗
        </a>
      </div>
    );
  return (
    <div>
      <button
        type="button"
        className={
          "button" +
          (wide ? " wide" : "") +
          (variant === "secondary" ? " secondary" : "")
        }
        disabled={disabled || isPending || receipt.isLoading}
        onClick={() => writeContract({
          address: CONTRACT,
          abi: poapAbi,
          functionName: name,
          args,
        } as any)}
      >
        {isPending
          ? "Confirm in wallet"
          : receipt.isLoading
            ? "Confirming…"
            : label}
      </button>
      {error && <p className="error">{friendlyTransactionError(error)}</p>}
    </div>
  );
}

function friendlyTransactionError(error: Error) {
  const candidate = error as Error & {
    shortMessage?: string;
    details?: string;
  };
  const message =
    candidate.shortMessage || candidate.details || error.message || "";

  if (/insufficient funds|exceeds.*balance|not enough funds/i.test(message))
    return "This wallet does not have enough Base Sepolia ETH to pay network gas.";
  if (/user rejected|user denied|rejected the request/i.test(message))
    return "Transaction cancelled in the wallet.";
  if (/already claimed|already minted/i.test(message))
    return "This wallet has already claimed this POAP.";
  if (/contract function .* reverted|execution reverted/i.test(message))
    return "The contract rejected this transaction. Check the wallet's eligibility and the selected mint method.";

  return message.split("\n")[0] || "The transaction could not be prepared.";
}

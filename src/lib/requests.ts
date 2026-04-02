import { toast } from "sonner";


export async function submitRequest(
  type: "ADD_PROJECT" | "EDIT_PROJECT" | "ADD_TASK" | "EDIT_TASK" | "ADD_DOCUMENT" | "EDIT_DOCUMENT",
  payload: Record<string, any>
) {
  try {
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type, payload }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to submit request");
    }

    const request = await res.json();
    toast.success(`${type.replace(/_/g, " ")} request submitted for approval`);
    return request;
  } catch (error: any) {
    toast.error(error.message || "Failed to submit request");
    throw error;
  }
}

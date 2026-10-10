import { createFileRoute } from "@tanstack/react-router";
import { AccountPage, accountHead } from "@/components/AccountPage";

export const Route = createFileRoute("/account/profile")({
  head: accountHead("Profile", "Manage your NEXA profile."),
  component: () => (
    <AccountPage title="Profile">
      <form className="surface grid gap-3 p-4 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
        {["Full name", "Email", "Phone", "Country"].map((l) => (
          <label key={l} className="text-sm font-medium">{l}<input disabled className="field mt-1" /></label>
        ))}
        <button disabled className="btn btn-primary md:col-span-2">Save changes</button>
      </form>
    </AccountPage>
  ),
});

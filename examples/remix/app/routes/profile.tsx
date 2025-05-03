import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { withJods } from "../../../src/remix/withJods";
import { user } from "../jods/user.jods";
import { useJodsStore, useJodsForm } from "../../../src/remix";

export const loader = ({ request }: LoaderFunctionArgs) => {
  return withJods([user], async () => {
    return {};
  })({ request });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // Forward action to appropriate jods handler
  const result = await user.action({ request });
  return result;
};

export default function Profile() {
  // Get the initial state from the loader
  useLoaderData<typeof loader>();

  // Subscribe to the user store with fine-grained reactivity
  const userData = useJodsStore(user);

  // Create form handlers for the different actions
  const profileForm = useJodsForm(user, "updateProfile");
  const themeForm = useJodsForm(user, "updateTheme");
  const notificationsForm = useJodsForm(user, "toggleNotifications");

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">User Profile</h1>

      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Profile Information</h2>

        <profileForm.Form>
          <div className="grid gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <input
                type="text"
                name="name"
                defaultValue={userData.name}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                name="email"
                defaultValue={userData.email}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Update Profile
          </button>
        </profileForm.Form>
      </div>

      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Preferences</h2>

        <div className="mb-6">
          <h3 className="text-md font-medium mb-2">
            Theme: {userData.preferences.theme}
          </h3>
          <div className="flex gap-2">
            {["light", "dark", "system"].map((theme) => (
              <themeForm.Form key={theme}>
                <input type="hidden" name="theme" value={theme} />
                <button
                  type="submit"
                  className={`px-3 py-1 rounded ${
                    userData.preferences.theme === theme
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              </themeForm.Form>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-md font-medium mb-2">Notifications</h3>
          <notificationsForm.Form>
            <button
              type="submit"
              className={`px-4 py-2 rounded ${
                userData.preferences.notifications
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {userData.preferences.notifications ? "Enabled" : "Disabled"}
            </button>
          </notificationsForm.Form>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        Last login:{" "}
        {userData.lastLogin
          ? new Date(userData.lastLogin).toLocaleString()
          : "Never"}
      </div>
    </div>
  );
}

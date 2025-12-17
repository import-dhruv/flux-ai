import { Protect, useClerk, useUser } from "@clerk/clerk-react";
import {
  Eraser,
  FileText,
  Hash,
  Image,
  LogOut,
  Scissors,
  SquarePen,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { House } from "lucide-react";

const navItems = [
  {
    to: "/ai",
    label: "Dashboard",
    Icon: House,
  },
  {
    to: "/ai/write-article",
    label: "Write Article",
    Icon: SquarePen,
  },
  {
    to: "/ai/blog-titles",
    label: "Blog Titles",
    Icon: Hash,
  },
  {
    to: "/ai/generate-image",
    label: "Generate Images",
    Icon: Image,
  },
  {
    to: "/ai/remove-background",
    label: "Remove Background",
    Icon: Eraser,
  },
  {
    to: "/ai/remove-object",
    label: "Remove Object",
    Icon: Scissors,
  },
  {
    to: "/ai/review-resume",
    label: "Review Resume",
    Icon: FileText,
  },
];
const Sidebar = ({ sidebar, setSidebar }) => {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();

  return (
    <div
      className={`w-60 h-full bg-white border-r border-gray-200 flex flex-col justify-start items-center max-sm:absolute max-sm:left-0 max-sm:top-14 max-sm:h-[calc(100%-3.5rem)] ${
        sidebar ? "translate-x-0" : "max-sm:-translate-x-full"
      } transition-all duration-300 ease-in-out`}
    >
      <div className="my-7 w-full">
        <img
          src={user.imageUrl}
          alt="avatar"
          className="w-12 h-12 rounded-full mx-auto"
        />
        <h1 className="mt-1 text-center">{user.fullName}</h1>
      </div>
      <div className="px-6 mt-5 text-sm text-gray-600 font-medium">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/ai"}
            onClick={() => setSidebar(false)}
            className={({ isActive }) =>
              `px-3.5 py-2.5 flex items-center gap-3 rounded ${
                isActive
                  ? "bg-gradient-to-r from-[#3C81F6] to-[#9234EA] text-white"
                  : ""
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`w-4 h-4 ${isActive ? "text-white" : ""}
                        `}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
      <div className="w-full border-t border-gray-200 p-4 px-7 flex items-center justify-between">
        <div
          onClick={openUserProfile}
          className="flex gap-2 items-center cursor-pointer"
        >
          <img src={user.imageUrl} className="w-8 rounded-full" alt="" />
          <div>
            <h1 className="text-sm font-medium">{user.fullName}</h1>
            <p className="text-xs text-gray-500">
              <Protect plan="premium" fallback="Free">
                Premium
              </Protect>
              Plan
            </p>
          </div>
        </div>
        <LogOut
          onClick={signOut}
          className="w-4.5 text-gray-400 hover:text-gray-700 transition cursor-pointer"
        />
      </div>
    </div>
  );
};

export default Sidebar;

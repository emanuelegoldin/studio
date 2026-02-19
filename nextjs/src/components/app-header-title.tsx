"use client";

import * as React from "react";

type AppHeaderTitleContextValue = {
  title: string;
  setTitle: (title: string) => void;
};

const AppHeaderTitleContext = React.createContext<AppHeaderTitleContextValue | null>(
  null
);

export function AppHeaderTitleProvider({
  defaultTitle = "Dashboard",
  children,
}: {
  defaultTitle?: string;
  children: React.ReactNode;
}) {
  const [title, setTitle] = React.useState(defaultTitle);

  const value = React.useMemo(() => ({ title, setTitle }), [title]);

  return (
    <AppHeaderTitleContext.Provider value={value}>
      {children}
    </AppHeaderTitleContext.Provider>
  );
}

export function useAppHeaderTitle() {
  const context = React.useContext(AppHeaderTitleContext);
  if (!context) {
    throw new Error(
      "useAppHeaderTitle must be used within AppHeaderTitleProvider"
    );
  }
  return context;
}

export function useSetAppHeaderTitle(title: string) {
  const { setTitle } = useAppHeaderTitle();

  React.useEffect(() => {
    setTitle(title);
  }, [setTitle, title]);
}

import { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode; label?: string };
type State = { hasError: boolean };

/**
 * Catches render-time errors inside a section of the page (e.g. a form)
 * so a single bad component doesn't crash the whole route to the router's
 * global "This page didn't load" screen. Shows a local retry instead.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[ErrorBoundary]", this.props.label ?? "", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="surface-card m-4 flex flex-col items-center gap-3 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm font-semibold">Kuna hitilafu ndogo hapa</p>
          <p className="text-xs text-muted-foreground">
            Jaribu tena. Ukiendelea kuona hii, taarifu msimamizi.
          </p>
          <Button size="sm" className="rounded-xl" onClick={() => this.setState({ hasError: false })}>
            Jaribu tena
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

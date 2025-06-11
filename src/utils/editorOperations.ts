
import { toast } from "@/hooks/use-toast";

// Simple operation tracking without blocking states
export class EditorOperations {
  private static operations = new Set<string>();

  static isOperationActive(operation: string): boolean {
    return this.operations.has(operation);
  }

  static startOperation(operation: string, description?: string): void {
    this.operations.add(operation);
    if (description) {
      toast({
        title: "Processing...",
        description,
        duration: 2000,
      });
    }
  }

  static endOperation(operation: string, success: boolean = true, message?: string): void {
    this.operations.delete(operation);
    if (message) {
      toast({
        title: success ? "Success" : "Error",
        description: message,
        variant: success ? "default" : "destructive",
        duration: success ? 2000 : 4000,
      });
    }
  }

  static clearAllOperations(): void {
    this.operations.clear();
  }
}

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  clientName: string;
  quoteNumber: number;
  quoteYear: number;
}

export const DeleteConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  clientName,
  quoteNumber,
  quoteYear,
}: DeleteConfirmDialogProps) => {
  const formattedNumber = `${quoteNumber.toString().padStart(2, '0')}-${quoteYear}`;
  
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="bg-white border-2 border-border max-w-lg p-8">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold text-red-600">Conferma eliminazione</AlertDialogTitle>
          <AlertDialogDescription className="text-lg font-semibold text-black mt-4">
            Sei sicuro di voler eliminare il preventivo {formattedNumber} {clientName}? Questa azione non può essere annullata.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 gap-3">
          <AlertDialogCancel className="text-lg font-bold px-8 py-6">
            Annulla
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white text-lg font-bold px-8 py-6"
          >
            Elimina
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SolscanImage from "/public/assets/icons/solscan.webp";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link";
import { useSelector } from "react-redux";
import { formatNumber } from "@/utils/utils";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { Button } from "./ui/button";


export const FeeTiersPopup = ({open, tiers, onClose}) => {
  const state = useSelector((state) => state.storage);

  return <Dialog 
    open={open}
    onOpenChange={() => onClose()}
    
  >
    <DialogTrigger></DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>DCA Fee Tiers</DialogTitle>
        <DialogDescription>
          More PRISM you have staked, the lower the fees you pay. Staking over 100K PRISM removes fees completely.
        </DialogDescription>
      </DialogHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Prism Staked</TableHead>
            <TableHead className="text-right">Fee Tier</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {
            tiers &&
            tiers.map((tier, i) => {
            return <TableRow key={i}>
              <TableCell className="text-md">
                {
                  formatNumber(tier.amount, 0)
                } 
                {tier.amount < 5000 ? " PRISM or Less" : " PRISM or More"}
              </TableCell>
              <TableCell className="text-md font-bold text-right">
                {
                  tier.fee
                }%
              </TableCell>
            </TableRow>
          })
        }
        </TableBody>
      </Table>
      <div className="flex w-full justify-end gap-4 mt-4">
        <Button variant={"secondary"} onClick={() => onClose()}>Close</Button>
        <Link href="https://v3.prism.ag/stake" target="_blank">
          <Button variant={"default"}>Stake PRISM</Button>
        </Link>
      </div>
    </DialogContent>
  </Dialog>
}
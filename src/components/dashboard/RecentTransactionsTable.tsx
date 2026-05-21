import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  currency: string;
  description?: string;
  merchant?: string | null;
  transaction_date: string;
}

interface RecentTransactionsTableProps {
  transactions: Transaction[];
  onRowClick?: (transaction: Transaction) => void;
}

type SortField = 'transaction_date' | 'amount' | 'category';
type SortOrder = 'asc' | 'desc';

export const RecentTransactionsTable = ({
  transactions,
  onRowClick
}: RecentTransactionsTableProps) => {
  const [sortField, setSortField] = useState<SortField>('transaction_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    let comparison = 0;

    if (sortField === 'transaction_date') {
      comparison = new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime();
    } else if (sortField === 'amount') {
      comparison = a.amount - b.amount;
    } else if (sortField === 'category') {
      comparison = a.category.localeCompare(b.category);
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return (
    <Card className="shadow-md col-span-full">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent transactions
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleSort('transaction_date')}
                      >
                        Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleSort('category')}
                      >
                        Category
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleSort('amount')}
                      >
                        Amount
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTransactions.slice(0, 10).map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                    onClick={() => onRowClick?.(transaction)}
                  >
                    <TableCell className="font-medium">
                      {formatDate(transaction.transaction_date)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {transaction.type === 'income' ? (
                          <>
                            <TrendingUp className="h-4 w-4 text-success" />
                            <Badge variant="secondary" className="bg-success/10 text-success hover:bg-success/20">
                              Income
                            </Badge>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-4 w-4 text-destructive" />
                            <Badge variant="secondary" className="bg-destructive/10 text-destructive hover:bg-destructive/20">
                              Expense
                            </Badge>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={transaction.type === 'income' ? 'text-success' : 'text-destructive'}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {transaction.description || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

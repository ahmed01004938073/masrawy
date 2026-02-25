
import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SearchResultsProps {
  searchResults: any[];
  handleProductSelect: (product: any) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ 
  searchResults, 
  handleProductSelect 
}) => {
  return (
    <Card className="overflow-hidden border-2 border-muted">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16"></TableHead>
              <TableHead className="text-right text-base font-cairo">المنتج</TableHead>
              <TableHead className="text-right text-base font-cairo">السعر</TableHead>
              <TableHead className="text-right text-base font-cairo w-20">إضافة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {searchResults.map((product) => (
              <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-12 h-12 object-contain rounded-md"
                  />
                </TableCell>
                <TableCell className="font-medium text-base">{product.name}</TableCell>
                <TableCell className="text-base">{product.price} ج.م</TableCell>
                <TableCell>
                  <Button 
                    onClick={() => handleProductSelect(product)} 
                    size="sm"
                    variant="ghost"
                    className="h-10 w-10"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SearchResults;

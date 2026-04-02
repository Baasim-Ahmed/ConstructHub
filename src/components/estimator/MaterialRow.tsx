"use client";

import { Material, formatCurrency } from "@/lib/estimator";
import { MATERIAL_LIBRARY } from "@/lib/estimator-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";

interface MaterialRowProps {
  material: Material;
  onUpdate: (id: string, field: keyof Material, value: any) => void;
  onRemove: (id: string) => void;
}

export function MaterialRow({ material, onUpdate, onRemove }: MaterialRowProps) {
  const handleMaterialSelect = (selectedName: string) => {
    // Check if it's a library item
    const libraryItem = MATERIAL_LIBRARY.find(item => item.name === selectedName);
    if (libraryItem) {
      onUpdate(material.id, "name", libraryItem.name);
      onUpdate(material.id, "unitCost", libraryItem.unitCost);
    } else {
      onUpdate(material.id, "name", selectedName);
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium relative group">
        <Input
          list={`materials-${material.id}`}
          type="text"
          placeholder="Material name or select..."
          value={material.name}
          onChange={(e) => handleMaterialSelect(e.target.value)}
          className="h-8 w-full"
        />
        <datalist id={`materials-${material.id}`}>
          {MATERIAL_LIBRARY.map((item, idx) => (
            <option key={idx} value={item.name}>{item.category} - {formatCurrency(item.unitCost)}</option>
          ))}
        </datalist>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          placeholder="Unit cost (PKR)"
          value={material.unitCost || ""}
          onChange={(e) => onUpdate(material.id, "unitCost", parseFloat(e.target.value) || 0)}
          className="h-8"
          min="0"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          placeholder="Quantity"
          value={material.quantity || ""}
          onChange={(e) => onUpdate(material.id, "quantity", parseFloat(e.target.value) || 0)}
          className="h-8"
          min="0"
        />
      </TableCell>
      <TableCell className="text-right font-semibold">
        {formatCurrency(material.unitCost * material.quantity)}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(material.id)}
          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

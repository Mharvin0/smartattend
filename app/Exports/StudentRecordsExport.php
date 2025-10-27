<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class StudentRecordsExport implements FromArray, WithHeadings, WithStyles, WithColumnWidths, WithEvents
{
    protected $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function array(): array
    {
        return $this->data;
    }

    public function headings(): array
    {
        return [
            'Student ID',
            'Name',
            'Email',
            'Department',
            'Program',
            'Section',
            'Total Records',
            'Present',
            'Absent',
            'Late',
            'Attendance Rate (%)',
            'Interventions Count',
            'Priority',
            'Created At',
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 15, // Student ID
            'B' => 25, // Name
            'C' => 30, // Email
            'D' => 20, // Department
            'E' => 20, // Program
            'F' => 15, // Section
            'G' => 15, // Total Records
            'H' => 10, // Present
            'I' => 10, // Absent
            'J' => 10, // Late
            'K' => 18, // Attendance Rate
            'L' => 18, // Interventions Count
            'M' => 12, // Priority
            'N' => 20, // Created At
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Style the header row
            1 => [
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                ],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '3B82F6'],
                ],
                'alignment' => [
                    'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                ],
            ],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                
                // Apply alternating row colors
                $highestRow = $sheet->getHighestRow();
                for ($row = 2; $row <= $highestRow; $row++) {
                    if ($row % 2 == 0) {
                        $sheet->getStyle("A{$row}:N{$row}")->applyFromArray([
                            'fill' => [
                                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'F8FAFC'],
                            ],
                        ]);
                    }
                }

                // Style attendance rate column based on values
                for ($row = 2; $row <= $highestRow; $row++) {
                    $rateCell = "K{$row}";
                    $rateValue = $sheet->getCell($rateCell)->getValue();
                    
                    if (is_numeric($rateValue)) {
                        $color = '000000'; // Default black
                        if ($rateValue >= 80) {
                            $color = '059669'; // Green
                        } elseif ($rateValue >= 60) {
                            $color = 'D97706'; // Orange
                        } else {
                            $color = 'DC2626'; // Red
                        }
                        
                        $sheet->getStyle($rateCell)->applyFromArray([
                            'font' => [
                                'bold' => true,
                                'color' => ['rgb' => $color],
                            ],
                        ]);
                    }
                }

                // Add borders to all cells
                $sheet->getStyle("A1:N{$highestRow}")->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                            'color' => ['rgb' => 'D1D5DB'],
                        ],
                    ],
                ]);
            },
        ];
    }
}

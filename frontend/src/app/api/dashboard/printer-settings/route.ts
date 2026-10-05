import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/session";
import {
  DEFAULT_PRINTER_SETTING,
  validatePrinterSetting,
  type PrinterRole,
  type PrinterSettingData,
} from "@/lib/printerSettings";

function toClient(row: {
  id: string;
  name: string;
  role: string;
  connection: string;
  paperWidth: number;
  deviceName: string | null;
  printColumns: number;
  copies: number;
  autoPrint: boolean;
  mockPrinter: boolean;
}): PrinterSettingData {
  return {
    id: row.id,
    name: row.name,
    role: row.role as PrinterSettingData["role"],
    connection: row.connection as PrinterSettingData["connection"],
    paperWidth: row.paperWidth === 58 ? 58 : 80,
    deviceName: row.deviceName,
    printColumns: row.printColumns,
    copies: row.copies,
    autoPrint: row.autoPrint,
    mockPrinter: row.mockPrinter,
  };
}

/** Load printer settings for the staff restaurant (default: RECEIPT role). */
export async function GET(request: Request) {
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const role = (searchParams.get("role") || "RECEIPT") as PrinterRole;

  try {
    const row = await prisma.printerSetting.findUnique({
      where: {
        restaurantId_role: {
          restaurantId: session.user.restaurantId,
          role,
        },
      },
    });

    return NextResponse.json({
      setting: row ? toClient(row) : { ...DEFAULT_PRINTER_SETTING, role },
      desktopRequired: true,
    });
  } catch (error) {
    console.error("Load printer settings error:", error);
    return NextResponse.json(
      { error: "Could not load printer settings." },
      { status: 500 }
    );
  }
}

/** Upsert printer configuration for a role. */
export async function PUT(request: Request) {
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = validatePrinterSetting(body);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const data = validated.data;
    const row = await prisma.printerSetting.upsert({
      where: {
        restaurantId_role: {
          restaurantId: session.user.restaurantId,
          role: data.role,
        },
      },
      create: {
        restaurantId: session.user.restaurantId,
        name: data.name,
        role: data.role,
        connection: data.connection,
        paperWidth: data.paperWidth,
        deviceName: data.deviceName,
        printColumns: data.printColumns,
        copies: data.copies,
        autoPrint: data.autoPrint,
        mockPrinter: data.mockPrinter,
      },
      update: {
        name: data.name,
        connection: data.connection,
        paperWidth: data.paperWidth,
        deviceName: data.deviceName,
        printColumns: data.printColumns,
        copies: data.copies,
        autoPrint: data.autoPrint,
        mockPrinter: data.mockPrinter,
      },
    });

    return NextResponse.json({ setting: toClient(row) });
  } catch (error) {
    console.error("Save printer settings error:", error);
    return NextResponse.json(
      { error: "Could not save printer settings. Please try again." },
      { status: 500 }
    );
  }
}

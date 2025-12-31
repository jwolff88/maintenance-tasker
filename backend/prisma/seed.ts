import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo company
  const passwordHash = await bcrypt.hash('password123', 12);

  const company = await prisma.company.create({
    data: {
      name: 'Acme Property Management',
      email: 'admin@acme-pm.com',
      phone: '555-123-4567',
      address: '123 Main St, Suite 100, New York, NY 10001',
    },
  });

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@acme-pm.com',
      passwordHash,
      firstName: 'John',
      lastName: 'Admin',
      role: 'COMPANY_ADMIN',
      phone: '555-123-4567',
      companyId: company.id,
    },
  });

  // Create property manager
  const manager = await prisma.user.create({
    data: {
      email: 'manager@acme-pm.com',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Manager',
      role: 'PROPERTY_MANAGER',
      phone: '555-234-5678',
      companyId: company.id,
    },
  });

  // Create property owner
  const owner = await prisma.propertyOwner.create({
    data: {
      firstName: 'Robert',
      lastName: 'Owner',
      email: 'robert.owner@email.com',
      phone: '555-345-6789',
      notes: 'Prefers email communication. Approval required for expenses over $500.',
    },
  });

  // Create properties
  const property1 = await prisma.property.create({
    data: {
      name: 'Sunset Apartments',
      address: '456 Sunset Blvd',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90028',
      type: 'APARTMENT',
      units: 12,
      sqft: 15000,
      yearBuilt: 1985,
      status: 'HEALTHY',
      riskScore: 25,
      occupancy: 10,
      companyId: company.id,
      managerId: manager.id,
      ownerId: owner.id,
    },
  });

  const property2 = await prisma.property.create({
    data: {
      name: 'Oak Street House',
      address: '789 Oak Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      type: 'SINGLE_FAMILY',
      units: 1,
      sqft: 2200,
      yearBuilt: 1960,
      status: 'ATTENTION_NEEDED',
      riskScore: 65,
      occupancy: 1,
      companyId: company.id,
      managerId: manager.id,
      ownerId: owner.id,
    },
  });

  const property3 = await prisma.property.create({
    data: {
      name: 'Downtown Commercial',
      address: '100 Business Ave',
      city: 'San Jose',
      state: 'CA',
      zipCode: '95110',
      type: 'COMMERCIAL',
      units: 5,
      sqft: 8000,
      yearBuilt: 2005,
      status: 'CRITICAL',
      riskScore: 82,
      occupancy: 4,
      companyId: company.id,
      managerId: manager.id,
    },
  });

  // Create tenants
  const tenant1 = await prisma.tenant.create({
    data: {
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice.j@email.com',
      phone: '555-111-2222',
    },
  });

  const tenant2 = await prisma.tenant.create({
    data: {
      firstName: 'Bob',
      lastName: 'Smith',
      email: 'bob.smith@email.com',
      phone: '555-333-4444',
    },
  });

  // Create leases
  const now = new Date();
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await prisma.lease.create({
    data: {
      propertyId: property1.id,
      tenantId: tenant1.id,
      startDate: new Date(now.getFullYear(), 0, 1),
      endDate: oneYearFromNow,
      rentAmount: 1800,
      depositAmount: 3600,
      status: 'ACTIVE',
      renewalProb: 75,
    },
  });

  await prisma.lease.create({
    data: {
      propertyId: property2.id,
      tenantId: tenant2.id,
      startDate: new Date(now.getFullYear() - 1, 5, 1),
      endDate: thirtyDaysFromNow,
      rentAmount: 2500,
      depositAmount: 5000,
      status: 'ACTIVE',
      renewalProb: 40,
      terms: 'Tenant has 2 pets (cats). No smoking.',
    },
  });

  // Create vendor
  const vendor = await prisma.vendor.create({
    data: {
      name: 'Quick Fix Plumbing',
      email: 'service@quickfixplumbing.com',
      phone: '555-PLUMBER',
      specialties: ['plumbing', 'hvac'],
      licenseNumber: 'PLB-123456',
      insuranceExpiry: new Date(now.getFullYear() + 1, 11, 31),
      rating: 4.5,
      totalJobs: 23,
      avgResponseTime: 4,
      companyId: company.id,
    },
  });

  // Create maintenance tickets
  await prisma.maintenanceTicket.create({
    data: {
      title: 'Water heater not working',
      description: 'The water heater in unit 3 is not heating water properly. Tenant reports lukewarm water only.',
      status: 'NEW',
      priority: 'URGENT',
      category: 'PLUMBING',
      propertyId: property1.id,
      creatorId: manager.id,
      tenantId: tenant1.id,
      slaDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  await prisma.maintenanceTicket.create({
    data: {
      title: 'HVAC annual maintenance',
      description: 'Scheduled annual HVAC maintenance and filter replacement.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      category: 'HVAC',
      propertyId: property2.id,
      creatorId: manager.id,
      assigneeId: manager.id,
      vendorId: vendor.id,
      estimatedCost: 250,
    },
  });

  await prisma.maintenanceTicket.create({
    data: {
      title: 'Roof leak detected',
      description: 'Water stains appearing on ceiling of suite 3. Possible roof leak needs immediate inspection.',
      status: 'NEW',
      priority: 'HIGH',
      category: 'STRUCTURAL',
      propertyId: property3.id,
      creatorId: admin.id,
      suggestedFix: 'Based on similar issues, recommend checking roof flashing and drainage. May need full roof inspection.',
    },
  });

  // Create notes
  await prisma.note.create({
    data: {
      propertyId: property1.id,
      authorId: manager.id,
      content: 'Elevator modernization completed in 2023. All units have updated appliances.',
      type: 'PROPERTY',
      isInternal: true,
    },
  });

  await prisma.note.create({
    data: {
      propertyId: property2.id,
      authorId: manager.id,
      content: 'Foundation settling noticed on east side. Monitoring quarterly.',
      type: 'BUILDING',
      isInternal: true,
    },
  });

  await prisma.note.create({
    data: {
      propertyId: property2.id,
      authorId: admin.id,
      content: 'Current tenant has been reliable with payments. Consider offering renewal incentive.',
      type: 'TENANT',
      isInternal: true,
    },
  });

  // Create equipment
  await prisma.equipment.create({
    data: {
      propertyId: property1.id,
      name: 'Central HVAC System',
      type: 'HVAC',
      manufacturer: 'Carrier',
      model: 'XC21',
      installDate: new Date(2018, 5, 15),
      warrantyExpiry: new Date(now.getFullYear() + 2, 5, 15),
      lastServiceDate: new Date(now.getFullYear(), 2, 10),
      nextServiceDate: new Date(now.getFullYear(), 8, 10),
      expectedLifespan: 15,
    },
  });

  await prisma.equipment.create({
    data: {
      propertyId: property2.id,
      name: 'Water Heater',
      type: 'Water Heater',
      manufacturer: 'Rheem',
      model: 'ProTerra',
      installDate: new Date(2015, 3, 20),
      warrantyExpiry: new Date(now.getFullYear() - 1, 3, 20),
      lastServiceDate: new Date(now.getFullYear() - 1, 6, 1),
      nextServiceDate: new Date(now.getFullYear(), 0, 1),
      expectedLifespan: 12,
      notes: 'Warranty expired. Consider replacement within next 2 years.',
    },
  });

  // Create events
  await prisma.propertyEvent.create({
    data: {
      propertyId: property1.id,
      title: 'Annual Fire Inspection',
      type: 'INSPECTION',
      date: new Date(now.getFullYear(), now.getMonth() + 1, 15),
      description: 'Annual fire safety inspection required by city.',
    },
  });

  await prisma.propertyEvent.create({
    data: {
      propertyId: property3.id,
      title: 'Elevator Certification Due',
      type: 'COMPLIANCE_DEADLINE',
      date: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14),
      description: 'Elevator certification renewal deadline.',
    },
  });

  // Create inspections
  await prisma.inspection.create({
    data: {
      propertyId: property1.id,
      type: 'FIRE',
      status: 'SCHEDULED',
      scheduledAt: new Date(now.getFullYear(), now.getMonth() + 1, 15, 10, 0),
    },
  });

  // Create technician user
  const technician = await prisma.user.create({
    data: {
      email: 'tech@acme-pm.com',
      passwordHash,
      firstName: 'Mike',
      lastName: 'Technician',
      role: 'MAINTENANCE_STAFF',
      phone: '555-456-7890',
      companyId: company.id,
    },
  });

  // Create Assets
  const asset1 = await prisma.asset.create({
    data: {
      name: 'Generator 01',
      description: 'Main backup generator for building power',
      category: 'ELECTRICAL',
      location: 'Basement, Room B-12',
      manufacturer: 'Caterpillar',
      model: 'C15',
      serialNumber: 'CAT-2019-45678',
      purchaseDate: new Date(2019, 5, 15),
      warrantyExpiry: new Date(now.getFullYear() + 1, 5, 15),
      status: 'OPERATIONAL',
      companyId: company.id,
      propertyId: property1.id,
    },
  });

  const asset2 = await prisma.asset.create({
    data: {
      name: 'HVAC Unit - Floor 1',
      description: 'Central air conditioning unit for first floor',
      category: 'HVAC',
      location: 'Rooftop, Unit A',
      manufacturer: 'Carrier',
      model: 'WeatherMaster 50XC',
      serialNumber: 'WM-50XC-2020-001',
      purchaseDate: new Date(2020, 2, 10),
      warrantyExpiry: new Date(now.getFullYear(), 2, 10),
      status: 'NEEDS_MAINTENANCE',
      companyId: company.id,
      propertyId: property1.id,
    },
  });

  const asset3 = await prisma.asset.create({
    data: {
      name: 'Elevator - Main',
      description: 'Main passenger elevator',
      category: 'MECHANICAL',
      location: 'Building Core',
      manufacturer: 'Otis',
      model: 'Gen3',
      serialNumber: 'OTIS-GEN3-2015-789',
      purchaseDate: new Date(2015, 8, 20),
      status: 'OPERATIONAL',
      companyId: company.id,
      propertyId: property1.id,
    },
  });

  const asset4 = await prisma.asset.create({
    data: {
      name: 'Fire Suppression System',
      description: 'Building-wide fire sprinkler system',
      category: 'SAFETY',
      location: 'All Floors',
      manufacturer: 'SimplexGrinnell',
      model: 'TrueAlert ES',
      serialNumber: 'SGT-2018-45612',
      purchaseDate: new Date(2018, 1, 5),
      status: 'OPERATIONAL',
      companyId: company.id,
      propertyId: property1.id,
    },
  });

  const asset5 = await prisma.asset.create({
    data: {
      name: 'Water Pump Station',
      description: 'Main water pressure pump for building',
      category: 'PLUMBING',
      location: 'Basement, Utility Room',
      manufacturer: 'Grundfos',
      model: 'CR 15-3',
      serialNumber: 'GRD-CR15-2017-123',
      purchaseDate: new Date(2017, 11, 1),
      status: 'OUT_OF_SERVICE',
      notes: 'Motor failure detected, awaiting replacement parts',
      companyId: company.id,
      propertyId: property3.id,
    },
  });

  // Create Maintenance Tasks
  const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await prisma.task.create({
    data: {
      title: 'Generator monthly inspection',
      description: 'Perform monthly inspection and oil level check',
      status: 'OPEN',
      priority: 'MEDIUM',
      dueDate: weekFromNow,
      estimatedTime: 60,
      isRecurring: true,
      recurrenceType: 'MONTHLY',
      assetId: asset1.id,
      assignedToId: technician.id,
      createdById: admin.id,
      companyId: company.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Replace HVAC filters',
      description: 'Replace all air filters and check refrigerant levels',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: yesterdayDate,
      startedAt: weekAgo,
      estimatedTime: 120,
      assetId: asset2.id,
      assignedToId: technician.id,
      createdById: manager.id,
      companyId: company.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Elevator safety inspection',
      description: 'Annual safety inspection required by regulations',
      status: 'OPEN',
      priority: 'CRITICAL',
      dueDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      estimatedTime: 180,
      assetId: asset3.id,
      createdById: admin.id,
      companyId: company.id,
    },
  });

  await prisma.task.create({
    data: {
      title: 'Fire suppression system test',
      description: 'Quarterly test of fire suppression system',
      status: 'UNDER_REVIEW',
      priority: 'HIGH',
      dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      startedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      estimatedTime: 90,
      isRecurring: true,
      recurrenceType: 'QUARTERLY',
      assetId: asset4.id,
      assignedToId: technician.id,
      createdById: manager.id,
      companyId: company.id,
      photoBefore: '/uploads/sample/fire-system-before.jpg',
      photoAfter: '/uploads/sample/fire-system-after.jpg',
    },
  });

  await prisma.task.create({
    data: {
      title: 'Repair water pump motor',
      description: 'Replace failed motor and test system',
      status: 'OPEN',
      priority: 'CRITICAL',
      dueDate: yesterdayDate,
      estimatedTime: 240,
      assetId: asset5.id,
      createdById: admin.id,
      companyId: company.id,
      notes: 'Parts ordered from supplier, expected delivery in 2 days',
    },
  });

  await prisma.task.create({
    data: {
      title: 'Lubricate elevator cables',
      description: 'Routine lubrication of elevator cables and pulleys',
      status: 'COMPLETED',
      priority: 'LOW',
      dueDate: weekAgo,
      startedAt: new Date(weekAgo.getTime() - 24 * 60 * 60 * 1000),
      completedAt: weekAgo,
      estimatedTime: 45,
      actualTime: 50,
      assetId: asset3.id,
      assignedToId: technician.id,
      createdById: manager.id,
      companyId: company.id,
    },
  });

  console.log('Database seeded successfully!');
  console.log('\nDemo credentials:');
  console.log('Admin: admin@acme-pm.com / password123');
  console.log('Manager: manager@acme-pm.com / password123');
  console.log('Technician: tech@acme-pm.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { Router, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get notes for a property by type
router.get('/property/:propertyId', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type } = req.query;

    const property = await prisma.property.findFirst({
      where: { id: req.params.propertyId, companyId: req.user!.companyId }
    });

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    const notes = await prisma.note.findMany({
      where: {
        propertyId: req.params.propertyId,
        ...(type && { type: type as any })
      },
      include: {
        author: { select: { firstName: true, lastName: true } },
        attachments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(notes);
  } catch (error) {
    next(error);
  }
});

// Create note
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { propertyId, content, type, isInternal } = req.body;

    const property = await prisma.property.findFirst({
      where: { id: propertyId, companyId: req.user!.companyId }
    });

    if (!property) {
      throw new AppError('Property not found', 404);
    }

    const note = await prisma.note.create({
      data: {
        propertyId,
        content,
        type: type || 'PROPERTY',
        isInternal: isInternal ?? true,
        authorId: req.user!.id
      },
      include: {
        author: { select: { firstName: true, lastName: true } },
        attachments: true
      }
    });

    await prisma.activityLog.create({
      data: {
        action: 'NOTE_CREATED',
        details: `${type || 'Property'} note added`,
        userId: req.user!.id,
        propertyId
      }
    });

    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
});

// Update note
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const note = await prisma.note.findUnique({
      where: { id: req.params.id },
      include: { property: { select: { companyId: true } } }
    });

    if (!note || note.property.companyId !== req.user!.companyId) {
      throw new AppError('Note not found', 404);
    }

    // Only author can edit
    if (note.authorId !== req.user!.id) {
      throw new AppError('Only the author can edit this note', 403);
    }

    const updated = await prisma.note.update({
      where: { id: req.params.id },
      data: {
        content: req.body.content,
        isInternal: req.body.isInternal
      },
      include: {
        author: { select: { firstName: true, lastName: true } },
        attachments: true
      }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete note
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const note = await prisma.note.findUnique({
      where: { id: req.params.id },
      include: { property: { select: { companyId: true } } }
    });

    if (!note || note.property.companyId !== req.user!.companyId) {
      throw new AppError('Note not found', 404);
    }

    // Only author or admin can delete
    if (note.authorId !== req.user!.id &&
        !['COMPANY_ADMIN', 'SUPER_ADMIN'].includes(req.user!.role)) {
      throw new AppError('Not authorized to delete this note', 403);
    }

    await prisma.note.delete({ where: { id: req.params.id } });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;

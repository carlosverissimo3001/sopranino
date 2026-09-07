import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DemoService } from './demo.service';
import { ChartRepository } from '../../chart/repositories/chart.repository';
import { TrackService } from '../../track/services/track.service';
import { TrackEntity } from '../../track/entities/track.entity';
import { RedisService } from '@redis/redis.service';
import { AppLoggerService } from '../../logger/logger.service';
import { DEMO_PLAYLISTS, DEMO_SNIPPET_STEPS } from '../demo.constants';
import { DemoRoundStatus } from '../dto/demo-round.dto';

const track = (n: number): TrackEntity =>
  new TrackEntity({
    id: `dz:${n}`,
    name: `Track ${n}`,
    artistName: `Artist ${n}`,
    albumImageUrl: `https://img/${n}`,
    allArtists: [`Artist ${n}`],
  });

describe('DemoService', () => {
  let service: DemoService;
  let charts: jest.Mocked<ChartRepository>;
  let trackService: jest.Mocked<TrackService>;
  let store: Map<string, string>;

  beforeEach(async () => {
    store = new Map();

    const redis = {
      get: jest.fn((k: string) => Promise.resolve(store.get(k) ?? null)),
      set: jest.fn((k: string, v: string) => {
        store.set(k, v);
        return Promise.resolve();
      }),
    };

    const logger = {
      child: () => ({
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DemoService,
        { provide: RedisService, useValue: redis },
        {
          provide: ChartRepository,
          useValue: {
            members: jest.fn().mockResolvedValue([]),
            imageUrlsByName: jest.fn().mockResolvedValue(new Map()),
          },
        },
        {
          provide: TrackService,
          useValue: {
            resolvePreview: jest.fn().mockResolvedValue('https://preview.mp3'),
          },
        },
        { provide: AppLoggerService, useValue: logger },
      ],
    }).compile();

    service = module.get(DemoService);
    charts = module.get(ChartRepository);
    trackService = module.get(TrackService);
  });

  describe('getPlaylists', () => {
    it('keeps the configured slugs and order, whatever the charts are called', async () => {
      charts.imageUrlsByName.mockResolvedValue(
        new Map([['Portugal', 'https://covers/pt.png']]),
      );

      const result = await service.getPlaylists();

      expect(result.map((p) => p.slug)).toEqual(
        DEMO_PLAYLISTS.map((p) => p.slug),
      );
      expect(result[0].slug).toBe('pt');
      expect(result[0].imageUrl).toBe('https://covers/pt.png');
    });

    // The portfolio renders the picker from this, so a chart with no cover set
    // has to stay in the list rather than drop out of it.
    it('lists a chart that has no cover yet', async () => {
      const result = await service.getPlaylists();

      expect(result).toHaveLength(DEMO_PLAYLISTS.length);
      expect(result.every((p) => p.imageUrl === '')).toBe(true);
    });
  });

  describe('createRound', () => {
    it('rejects an unknown playlist', async () => {
      await expect(service.createRound('nope')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('reads the chart the slug maps to', async () => {
      charts.members.mockResolvedValue([1, 2, 3, 4, 5].map(track));

      await service.createRound('us');

      expect(charts.members).toHaveBeenCalledWith('USA');
    });

    it('reports unavailable when the chart is not populated', async () => {
      charts.members.mockResolvedValue([track(1), track(2)]);
      await expect(service.createRound('pt')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('returns four options and never leaks the answer', async () => {
      charts.members.mockResolvedValue([1, 2, 3, 4, 5].map(track));

      const round = await service.createRound('pt');

      expect(round.options).toHaveLength(4);
      expect(new Set(round.options.map((o) => o.id)).size).toBe(4);
      expect(round.attempt).toBe(1);
      expect(round.snippetDuration).toBe(DEMO_SNIPPET_STEPS[0]);
      // The payload carries the answer's audio, which it must, but nothing
      // that says which of the four options it belongs to.
      expect(round.previewUrl).toBe('https://preview.mp3');
      expect(round).not.toHaveProperty('answer');
      expect(round.options.every((o) => !('previewUrl' in o))).toBe(true);
    });

    // Charts store no audio, so a preview is minted per round and can come back
    // empty. That costs a redraw rather than a silent round.
    it('draws again when a track has no playable audio', async () => {
      charts.members.mockResolvedValue([1, 2, 3, 4, 5].map(track));
      trackService.resolvePreview
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('https://preview.mp3');

      const round = await service.createRound('pt');

      expect(round.previewUrl).toBe('https://preview.mp3');
      expect(trackService.resolvePreview).toHaveBeenCalledTimes(2);
    });

    it('draws again when resolving a preview throws', async () => {
      charts.members.mockResolvedValue([1, 2, 3, 4, 5].map(track));
      trackService.resolvePreview
        .mockRejectedValueOnce(new Error('deezer down'))
        .mockResolvedValueOnce('https://preview.mp3');

      await expect(service.createRound('pt')).resolves.toBeDefined();
    });

    it('reports unavailable when nothing in the chart has audio', async () => {
      charts.members.mockResolvedValue([1, 2, 3, 4, 5].map(track));
      trackService.resolvePreview.mockResolvedValue(null);

      await expect(service.createRound('pt')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('never offers the answer as its own decoy', async () => {
      charts.members.mockResolvedValue([1, 2, 3, 4, 5].map(track));

      const round = await service.createRound('pt');
      const state = JSON.parse(
        store.get(`demo:round:${round.roundId}`) as string,
      ) as { answer: { id: string } };

      expect(
        round.options.filter((o) => o.id === state.answer.id),
      ).toHaveLength(1);
    });
  });

  describe('guess', () => {
    const startRound = async () => {
      charts.members.mockResolvedValue([1, 2, 3, 4, 5].map(track));
      const round = await service.createRound('pt');
      const state = JSON.parse(
        store.get(`demo:round:${round.roundId}`) as string,
      ) as { answer: { id: string } };
      return { round, answerId: state.answer.id };
    };

    it('rejects a track that is not one of the options', async () => {
      const { round } = await startRound();
      await expect(service.guess(round.roundId, 'dz:999')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects an unknown round', async () => {
      await expect(service.guess('missing', 'dz:1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('wins and reveals the answer', async () => {
      const { round, answerId } = await startRound();

      const result = await service.guess(round.roundId, answerId);

      expect(result.correct).toBe(true);
      expect(result.status).toBe(DemoRoundStatus.WON);
      expect(result.answer?.id).toBe(answerId);
    });

    it('withholds the answer while the round is still playing', async () => {
      const { round, answerId } = await startRound();
      const wrong = round.options.find((o) => o.id !== answerId)!;

      const result = await service.guess(round.roundId, wrong.id);

      expect(result.correct).toBe(false);
      expect(result.status).toBe(DemoRoundStatus.PLAYING);
      expect(result.answer).toBeUndefined();
      expect(result.wrongIds).toEqual([wrong.id]);
      expect(result.snippetDuration).toBe(DEMO_SNIPPET_STEPS[1]);
    });

    it('loses after exhausting every attempt, then reveals', async () => {
      const { round, answerId } = await startRound();
      const wrong = round.options.filter((o) => o.id !== answerId);

      let result;
      for (let i = 0; i < DEMO_SNIPPET_STEPS.length; i++) {
        result = await service.guess(round.roundId, wrong[i % wrong.length].id);
      }

      expect(result?.status).toBe(DemoRoundStatus.LOST);
      expect(result?.correct).toBe(false);
      expect(result?.answer?.id).toBe(answerId);
    });

    it('is idempotent once resolved', async () => {
      const { round, answerId } = await startRound();
      await service.guess(round.roundId, answerId);

      const again = await service.guess(round.roundId, answerId);

      expect(again.status).toBe(DemoRoundStatus.WON);
    });
  });
});

import React from 'react';
import { createPortal } from 'react-dom';
import {
  Button,
  TextField,
  Typography,
  Box,
} from '@mui/material';
import type { ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';

interface EmptyCardContentProps {
  onCreateBoard: () => unknown;
  onJoinBoard: (contractAddress: ContractAddress) => unknown;
}

export const EmptyCardContent: React.FC<EmptyCardContentProps> = ({
  onCreateBoard,
  onJoinBoard,
}) => {
  const [address, setAddress] = React.useState('');

  const ui = (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,

        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',

        width: '100vw',
        height: '100vh',

        background:
          'radial-gradient(circle at 50% 40%, rgba(88,28,135,0.22), transparent 38%), #000',

        overflowY: 'auto',
        boxSizing: 'border-box',
        p: { xs: 2, sm: 3 },
      }}
    >
      {/* Main card */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 560,
          maxHeight: 'calc(100vh - 40px)',

          overflowY: 'auto',

          borderRadius: '28px',

          background:
            'linear-gradient(145deg, #11162d 0%, #080b18 100%)',

          border: '1px solid rgba(139,92,246,0.45)',

          boxShadow:
            '0 30px 100px rgba(0,0,0,0.75), 0 0 70px rgba(124,58,237,0.25)',

          p: { xs: 3, sm: 5 },

          boxSizing: 'border-box',
        }}
      >
        {/* Lock icon */}
        <Box
          sx={{
            width: 86,
            height: 86,
            mx: 'auto',
            mb: 3,

            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',

            borderRadius: '24px',

            background:
              'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)',

            fontSize: 44,

            boxShadow:
              '0 15px 40px rgba(124,58,237,0.4)',
          }}
        >
          🔐
        </Box>

        {/* Heading */}
        <Typography
          sx={{
            textAlign: 'center',
            color: '#fff',
            fontSize: { xs: 28, sm: 34 },
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.7px',
          }}
        >
          Private Bulletin Board
        </Typography>

        <Typography
          sx={{
            mt: 1.5,
            mb: 3.5,

            textAlign: 'center',

            color: 'rgba(226,232,240,0.72)',
            fontSize: 15,
            lineHeight: 1.6,
          }}
        >
          A private and secure place to share
          <br />
          messages on Midnight.
        </Typography>

        {/* CREATE BUTTON */}
        <Button
          variant="contained"
          fullWidth
          onClick={onCreateBoard}
          sx={{
            height: 58,

            borderRadius: '16px',

            textTransform: 'none',

            fontSize: 17,
            fontWeight: 700,

            color: '#fff',

            background:
              'linear-gradient(90deg, #6366f1, #7c3aed, #a855f7)',

            boxShadow:
              '0 12px 30px rgba(124,58,237,0.35)',

            '&:hover': {
              background:
                'linear-gradient(90deg, #4f46e5, #6d28d9, #9333ea)',

              transform: 'translateY(-2px)',

              boxShadow:
                '0 16px 40px rgba(124,58,237,0.5)',
            },

            transition: 'all 0.2s ease',
          }}
        >
          ✨ Create New Board
        </Button>

        {/* Divider */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,

            my: 3,
          }}
        >
          <Box
            sx={{
              flex: 1,
              height: '1px',
              background: 'rgba(148,163,184,0.2)',
            }}
          />

          <Typography
            sx={{
              color: 'rgba(203,213,225,0.55)',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            OR
          </Typography>

          <Box
            sx={{
              flex: 1,
              height: '1px',
              background: 'rgba(148,163,184,0.2)',
            }}
          />
        </Box>

        {/* JOIN CARD */}
        <Box
          sx={{
            p: 2.5,

            borderRadius: '18px',

            background:
              'rgba(255,255,255,0.035)',

            border:
              '1px solid rgba(148,163,184,0.16)',
          }}
        >
          <Typography
            sx={{
              color: '#c4b5fd',
              fontSize: 18,
              fontWeight: 700,
              mb: 0.7,
            }}
          >
            Join Existing Board
          </Typography>

          <Typography
            sx={{
              color: 'rgba(226,232,240,0.6)',
              fontSize: 13,
              lineHeight: 1.5,
              mb: 2,
            }}
          >
            Enter the contract address of the board you want to join.
          </Typography>

          <TextField
            fullWidth
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Paste contract address"
            variant="outlined"
            sx={{
              mb: 1.5,

              '& .MuiOutlinedInput-root': {
                color: '#fff',

                borderRadius: '12px',

                background: '#0b1020',

                '& fieldset': {
                  borderColor: 'rgba(148,163,184,0.25)',
                },

                '&:hover fieldset': {
                  borderColor: '#8b5cf6',
                },

                '&.Mui-focused fieldset': {
                  borderColor: '#a855f7',
                },
              },

              '& input::placeholder': {
                color: 'rgba(203,213,225,0.45)',
                opacity: 1,
              },
            }}
          />

          <Button
            fullWidth
            variant="outlined"
            disabled={!address.trim()}
            onClick={() => {
  console.log('JOIN BUTTON CLICKED');
  console.log('Contract address:', address.trim());
  onJoinBoard(address.trim() as ContractAddress);
}}
            sx={{
              height: 52,

              borderRadius: '13px',

              textTransform: 'none',

              fontSize: 15,
              fontWeight: 700,

              color: '#c4b5fd',

              borderColor: '#7c3aed',

              '&:hover': {
                borderColor: '#a855f7',
                background: 'rgba(124,58,237,0.12)',
              },

              '&.Mui-disabled': {
                color: 'rgba(203,213,225,0.35)',
                borderColor: 'rgba(148,163,184,0.18)',
              },
            }}
          >
            👥 Join Existing Board
          </Button>
        </Box>

        {/* Footer */}
        <Typography
          sx={{
            textAlign: 'center',

            mt: 3,

            color: 'rgba(203,213,225,0.45)',

            fontSize: 12,
          }}
        >
          🛡 Privacy protected by{' '}
          <Box
            component="span"
            sx={{
              color: '#a78bfa',
              fontWeight: 700,
            }}
          >
            Midnight
          </Box>
        </Typography>
      </Box>
    </Box>
  );

  return createPortal(ui, document.body);
};

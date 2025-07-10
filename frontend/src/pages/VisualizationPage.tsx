import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { useQuery } from 'react-query';
import { securityGroupService } from '../services/securityGroupService';
import { VisualizationData } from '../types';

export const VisualizationPage: React.FC = () => {
  const networkRef = useRef<HTMLDivElement>(null);
  const networkInstance = useRef<Network | null>(null);
  const [selectedVpc, setSelectedVpc] = useState<string>('all');
  const [showExpiredOnly, setShowExpiredOnly] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // 시각화 데이터 조회
  const { data: visualizationData, isLoading, error } = useQuery<VisualizationData>(
    'visualizationData',
    securityGroupService.getVisualizationData
  );

  // Security Groups 데이터 조회 (VPC 필터링용)
  const { data: securityGroups = [] } = useQuery(
    'securityGroups',
    securityGroupService.getAllSecurityGroups
  );

  // VPC 목록 추출
  const vpcs = Array.from(new Set(securityGroups.map(sg => sg.vpcId))).filter(Boolean);

  useEffect(() => {
    if (!visualizationData || !networkRef.current) return;

    // 데이터 필터링
    let filteredNodes = visualizationData.nodes;
    let filteredEdges = visualizationData.edges;

    // VPC 필터링
    if (selectedVpc !== 'all') {
      filteredNodes = filteredNodes.filter(node => node.group === selectedVpc);
      const nodeIds = new Set(filteredNodes.map(node => node.id));
      filteredEdges = filteredEdges.filter(edge => 
        nodeIds.has(edge.from) && nodeIds.has(edge.to)
      );
    }

    // 만료된 노드만 표시
    if (showExpiredOnly) {
      filteredNodes = filteredNodes.filter(node => node.color === '#ff4444');
      const nodeIds = new Set(filteredNodes.map(node => node.id));
      filteredEdges = filteredEdges.filter(edge => 
        nodeIds.has(edge.from) && nodeIds.has(edge.to)
      );
    }

    // vis-network 데이터 생성
    const nodes = new DataSet(filteredNodes.map(node => ({
      id: node.id,
      label: node.label,
      title: node.title,
      color: {
        background: node.color,
        border: selectedNode === node.id ? '#000000' : node.color,
        highlight: {
          background: node.color,
          border: '#000000'
        }
      },
      font: {
        color: '#ffffff',
        size: 12,
        face: 'Arial'
      },
      shape: 'box',
      margin: 10,
      widthConstraint: {
        minimum: 100,
        maximum: 200
      }
    })));

    const edges = new DataSet(filteredEdges.map(edge => ({
      from: edge.from,
      to: edge.to,
      label: edge.label,
      arrows: edge.arrows,
      color: {
        color: '#848484',
        highlight: '#000000'
      },
      font: {
        size: 10,
        color: '#343434'
      },
      smooth: {
        type: 'curvedCW',
        roundness: 0.2
      }
    })));

    // 네트워크 옵션
    const options = {
      layout: {
        improvedLayout: true,
        hierarchical: {
          enabled: false
        }
      },
      physics: {
        enabled: true,
        stabilization: {
          enabled: true,
          iterations: 100
        },
        barnesHut: {
          gravitationalConstant: -2000,
          centralGravity: 0.3,
          springLength: 95,
          springConstant: 0.04,
          damping: 0.09
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        hideEdgesOnDrag: true,
        hideNodesOnDrag: false
      },
      nodes: {
        borderWidth: 2,
        shadow: true
      },
      edges: {
        width: 2,
        shadow: true
      },
      groups: {
        // VPC별 그룹 스타일링
        ...Object.fromEntries(vpcs.map(vpc => [vpc, {
          color: {
            background: '#97C2FC',
            border: '#2B7CE9'
          }
        }]))
      }
    };

    // 기존 네트워크 인스턴스 정리
    if (networkInstance.current) {
      networkInstance.current.destroy();
    }

    // 새 네트워크 인스턴스 생성
    networkInstance.current = new Network(
      networkRef.current,
      { nodes, edges },
      options
    );

    // 이벤트 리스너 추가
    networkInstance.current.on('click', (params) => {
      if (params.nodes.length > 0) {
        setSelectedNode(params.nodes[0]);
      } else {
        setSelectedNode(null);
      }
    });

    networkInstance.current.on('hoverNode', (params) => {
      networkRef.current!.style.cursor = 'pointer';
    });

    networkInstance.current.on('blurNode', (params) => {
      networkRef.current!.style.cursor = 'default';
    });

    return () => {
      if (networkInstance.current) {
        networkInstance.current.destroy();
        networkInstance.current = null;
      }
    };
  }, [visualizationData, selectedVpc, showExpiredOnly, selectedNode, vpcs]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        시각화 데이터를 불러오는데 실패했습니다.
      </Alert>
    );
  }

  const selectedNodeData = visualizationData?.nodes.find(node => node.id === selectedNode);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Security Group 시각화
      </Typography>

      {/* 컨트롤 패널 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>VPC 필터</InputLabel>
              <Select
                value={selectedVpc}
                label="VPC 필터"
                onChange={(e) => setSelectedVpc(e.target.value)}
              >
                <MenuItem value="all">모든 VPC</MenuItem>
                {vpcs.map(vpc => (
                  <MenuItem key={vpc} value={vpc}>{vpc}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={showExpiredOnly}
                  onChange={(e) => setShowExpiredOnly(e.target.checked)}
                />
              }
              label="만료된 규칙만 표시"
            />

            <Box display="flex" gap={1} alignItems="center">
              <Typography variant="body2">범례:</Typography>
              <Chip
                label="정상"
                size="small"
                sx={{ bgcolor: '#44aa44', color: 'white' }}
              />
              <Chip
                label="만료일 설정"
                size="small"
                sx={{ bgcolor: '#ffaa00', color: 'white' }}
              />
              <Chip
                label="만료된 규칙"
                size="small"
                sx={{ bgcolor: '#ff4444', color: 'white' }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 시각화 영역 */}
      <Card>
        <CardContent>
          <Box
            ref={networkRef}
            sx={{
              width: '100%',
              height: '600px',
              border: '1px solid #ddd',
              borderRadius: 1,
            }}
          />
        </CardContent>
      </Card>

      {/* 선택된 노드 정보 */}
      {selectedNodeData && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              선택된 Security Group
            </Typography>
            <Typography variant="body1">
              <strong>이름:</strong> {selectedNodeData.label}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>ID:</strong> {selectedNodeData.id}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>VPC:</strong> {selectedNodeData.group}
            </Typography>
            <Box mt={1}>
              <Typography variant="body2" component="div">
                {selectedNodeData.title.split('\\n').map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 사용법 안내 */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>사용법:</strong>
        </Typography>
        <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
          <li>노드를 클릭하면 상세 정보를 볼 수 있습니다</li>
          <li>마우스 휠로 확대/축소할 수 있습니다</li>
          <li>노드를 드래그하여 위치를 조정할 수 있습니다</li>
          <li>화살표는 Security Group 간의 참조 관계를 나타냅니다</li>
        </ul>
      </Alert>
    </Box>
  );
};

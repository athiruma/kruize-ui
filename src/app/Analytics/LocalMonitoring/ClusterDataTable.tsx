import { PageSection, PageSectionVariants, TextContent } from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getClusterMetadataURL } from '@app/CentralConfig';
interface LocationState {
  cluster: string;
  datasource: string;
}
interface Container {
  container_name: string;
  container_image_name: string;
}

interface Workload {
  workload_name: string;
  workload_type: string;
  containers: Record<string, Container>;
}

interface Namespace {
  namespace: string;
  workloads?: Record<string, Workload>;
}

interface Cluster {
  cluster_name: string;
  namespaces: Record<string, Namespace>;
}

interface ClusterGroup {
  cluster_group_name: string;
  clusters: Record<string, Cluster>;
}

interface ApiData {
  cluster_groups: Record<string, ClusterGroup>;
}

interface TableData {
  containerName: string;
  projectName: string;
  workloadName: string;
  workloadType: string;
  clusterName: string;
  containerImageName: string;
}

const ClusterDataTable = (props: { clusterSpecificData }) => {
  const [clusterData, setClusterData] = useState([]);
  const [namespaceData, setNamespaceData] = useState([]);

  // fetching the ds name via react-router-dom
  const location = useLocation<LocationState>();
  const datasource = location.state?.datasource;
  const cluster = location.state?.cluster;

  const fetchCluster = async () => {
    const response = await fetch(getClusterMetadataURL(datasource, cluster));
    const data = await response.json();
    setClusterData(data);
    console.log(data);
    setNamespaceData(data.cluster_groups[datasource].clusters[cluster]);
    console.log(data.cluster_groups[datasource].clusters[cluster]);
  };

  useEffect(() => {
    try {
      fetchCluster();
    } catch {
      console.log('Clusters get URL not working');
    }
  }, []);

  function extractTableData(apiData: ApiData): TableData[] {
    const tableData: TableData[] = [];

    if (apiData && apiData.cluster_groups) {
      for (const clusterGroup of Object.values(apiData.cluster_groups)) {
        for (const cluster of Object.values(clusterGroup.clusters)) {
          for (const [namespaceName, namespace] of Object.entries(cluster.namespaces)) {
            if (!namespace.workloads) continue;

            for (const [workloadName, workload] of Object.entries(namespace.workloads)) {
              if (!workload.containers) continue;

              for (const [_, container] of Object.entries(workload.containers)) {
                tableData.push({
                  containerName: container.container_name,
                  containerImageName: container.container_image_name,
                  projectName: namespaceName,
                  workloadName: workload.workload_name,
                  workloadType: workload.workload_type,
                  clusterName: cluster.cluster_name
                });
              }
            }
          }
        }
      }
    }

    return tableData;
  }

  const tableData = extractTableData(clusterData);
  // console.log(tableData);

  return (
    <PageSection variant={PageSectionVariants.light}>
      <TextContent>Cluster Specific Details</TextContent>
      <Table aria-label="Cluster Details">
        <Thead>
          <Tr>
            <Th>Container names</Th>
            <Th>Project names</Th>
            <Th>Workload names</Th>
            <Th>Workload types</Th>
            <Th>Cluster names</Th>
          </Tr>
        </Thead>
        <Tbody>
          {tableData.map((row_data, index) => (
            <Tr key={index} {...(index % 2 === 0 && { isStriped: true })}>
              <Td dataLabel="Container names">
                <Link
                  to={{
                    pathname: '/createexp',
                    state: {
                      containerName: row_data?.containerName,
                      projectName: row_data?.projectName,
                      workloadName: row_data?.workloadName,
                      workloadType: row_data?.workloadType,
                      clusterName: row_data?.clusterName,
                      containerImageName: row_data?.containerImageName
                    }
                  }}
                >
                  {' '}
                  {row_data?.containerName}
                </Link>
              </Td>
              <Td dataLabel="Project names">{row_data.projectName}</Td>
              <Td dataLabel="Workload names">{row_data.workloadName}</Td>
              <Td dataLabel="Workload types">{row_data.workloadType}</Td>
              <Td dataLabel="Cluster names">{row_data.clusterName}</Td>
              {/* <Td dataLabel="Container image names">{row_data.containerImageName}</Td> */}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </PageSection>
  );
};

export { ClusterDataTable };

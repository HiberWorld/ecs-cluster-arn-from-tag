import * as core from "@actions/core";
import { ECS } from "aws-sdk";

async function run(): Promise<void> {
  try {
    const ecs = new ECS();

    const getClusterArns = async (): Promise<ECS.StringList> => {
      return new Promise<string[]>((resolve, reject) => {
        ecs.listClusters((error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data.clusterArns);
        });
      });
    };

    const getTagsFromResourceArn = async (resourceArn: string): Promise<ECS.Tags> => {
      return new Promise<ECS.Tags>((resolve, reject) => {
        ecs.listTagsForResource({ resourceArn }, (error, resourceTags) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(resourceTags.tags);
        });
      });
    };

    const getClusterArnFromTag = async (tagKey: string, tagValue: string): Promise<string> => {
      let clusterArn = null;

      const clusterArns = await getClusterArns();

      for (const arn of clusterArns) {
        const resourceTags = await getTagsFromResourceArn(arn);

        resourceTags.map((tag) => {
          if (tag.key === tagKey && tag.value === tagValue) {
            clusterArn = arn;
          }
        });
      }

      if (!clusterArn) {
        throw new Error(`No arn found for tag ${tagKey} = ${tagValue}`);
      }

      return clusterArn;
    };

    const name = core.getInput("tagName");
    const value = core.getInput("tagValue");

    core.debug(`name = ${name}`);
    core.debug(`value = ${value}`);

    const arn = await getClusterArnFromTag(name, value);

    core.debug(`arn = ${arn}`);

    core.setOutput("arn", arn);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
